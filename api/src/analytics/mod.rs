mod handler;
mod pipelines;

pub use handler::*;

use crate::model::{Project, ProjectPipelines, RunnerWithJobs};
use crate::{group::GroupService, project::PipelineAggregator, runner::RunnerService};
use actix_web::web::Data;
use sqlx::postgres::{PgPool, PgPoolOptions};
use std::time::Duration;

#[derive(Clone, Default)]
pub struct AnalyticsStore {
    pub(crate) pool: Option<PgPool>,
}

impl AnalyticsStore {
    pub async fn connect(enabled: bool, database_url: Option<&str>, max_connections: u32) -> Result<Self, sqlx::Error> {
        if !enabled {
            log::info!("Analytics persistence is disabled");
            return Ok(Self::default());
        }

        let database_url = database_url.ok_or_else(|| {
            sqlx::Error::Configuration("database.url is required when analytics is enabled".into())
        })?;
        let pool = PgPoolOptions::new()
            .max_connections(max_connections)
            .connect(database_url)
            .await?;
        sqlx::migrate!("./migrations").run(&pool).await?;
        log::info!("Analytics database connected and migrations applied");
        Ok(Self { pool: Some(pool) })
    }

    pub fn pool(&self) -> Option<PgPool> { self.pool.clone() }

    pub fn enabled(&self) -> bool {
        self.pool.is_some()
    }

    pub async fn persist(&self, entries: &[ProjectPipelines]) -> Result<(), sqlx::Error> {
        let Some(pool) = &self.pool else { return Ok(()) };
        let mut transaction = pool.begin().await?;

        for entry in entries {
            upsert_project(&mut transaction, entry.group_id, &entry.project).await?;
            for pipeline in &entry.pipelines {
                let status = enum_name(&pipeline.status);
                let source = enum_name(&pipeline.source);
                sqlx::query(
                    r#"INSERT INTO analytics_pipelines
                       (gitlab_id,iid,project_id,sha,branch,status,source,coverage,created_at,updated_at,web_url)
                       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
                       ON CONFLICT (gitlab_id) DO UPDATE SET
                         status=EXCLUDED.status,coverage=EXCLUDED.coverage,
                         updated_at=EXCLUDED.updated_at,collected_at=NOW()"#,
                )
                .bind(pipeline.id as i64)
                .bind(pipeline.iid as i64)
                .bind(pipeline.project_id as i64)
                .bind(&pipeline.sha)
                .bind(&pipeline.branch)
                .bind(status)
                .bind(source)
                .bind(pipeline.coverage)
                .bind(pipeline.created_at)
                .bind(pipeline.updated_at)
                .bind(&pipeline.web_url)
                .execute(&mut *transaction)
                .await?;
            }
        }
        transaction.commit().await

    }
    pub async fn load_runners(&self, group_id: u64) -> Result<Option<Vec<RunnerWithJobs>>, sqlx::Error> {
        let Some(pool) = &self.pool else {
            return Ok(None);
        };
        let payload = sqlx::query_scalar::<_, serde_json::Value>(
            "SELECT payload FROM analytics_runner_state WHERE group_id = $1",
        )
        .bind(group_id as i64)
        .fetch_optional(pool)
        .await?;

        payload
            .map(serde_json::from_value)
            .transpose()
            .map_err(|error| sqlx::Error::Decode(Box::new(error)))
    }

    pub async fn persist_runners(
        &self,
        group_id: u64,
        runners: &[RunnerWithJobs],
    ) -> Result<(), sqlx::Error> {
        let Some(pool) = &self.pool else {
            return Ok(());
        };
        let payload = serde_json::to_value(runners)
            .map_err(|error| sqlx::Error::Encode(Box::new(error)))?;
        sqlx::query("INSERT INTO analytics_runner_state(group_id,payload) VALUES($1,$2) ON CONFLICT(group_id) DO UPDATE SET payload=EXCLUDED.payload,collected_at=NOW()")
            .bind(group_id as i64)
            .bind(payload)
            .execute(pool)
            .await?;
        Ok(())
    }

    async fn sync_state(&self, error: Option<&str>, complete: bool) -> Result<(), sqlx::Error> {
        let Some(pool) = &self.pool else { return Ok(()) };
        if complete {
            sqlx::query("INSERT INTO analytics_sync_state(scope,last_completed_at) VALUES('pipelines',NOW()) ON CONFLICT(scope) DO UPDATE SET last_completed_at=NOW(),last_error=NULL,updated_at=NOW()")
                .execute(pool).await?;
        } else if let Some(error) = error {
            sqlx::query("INSERT INTO analytics_sync_state(scope,last_error) VALUES('pipelines',$1) ON CONFLICT(scope) DO UPDATE SET last_error=$1,updated_at=NOW()")
                .bind(error).execute(pool).await?;
        } else {
            sqlx::query("INSERT INTO analytics_sync_state(scope,last_started_at) VALUES('pipelines',NOW()) ON CONFLICT(scope) DO UPDATE SET last_started_at=NOW(),last_error=NULL,updated_at=NOW()")
                .execute(pool).await?;
        }
        Ok(())
    }
}

pub fn spawn_sync(
    store: AnalyticsStore,
    groups: Data<GroupService>,
    pipelines: Data<PipelineAggregator>,
    runners: Data<RunnerService>,
    interval: Duration,
    retention_days: i64,
) {
    if !store.enabled() { return }
    tokio::spawn(async move {
        let mut ticker = tokio::time::interval(interval);
        loop {
            ticker.tick().await;
            if let Err(error) = synchronize(&store, &groups, &pipelines, retention_days, &runners).await {
                log::error!("Analytics synchronization failed: {error}");
                let _ = store.sync_state(Some(&error.to_string()), false).await;
            }
        }
    });
}

async fn synchronize(
    store: &AnalyticsStore,
    groups: &GroupService,
    pipelines: &PipelineAggregator,
    retention_days: i64,
    runners: &RunnerService,
) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
    store.sync_state(None, false).await?;
    for group in groups.get_groups("/analytics/groups").await? {
        pipelines.get_projects_with_pipelines(group.id, None, true).await?;
        if let Err(error) = runners.get_runners(group.id, true).await {
            log::warn!("Runner synchronization skipped for group {}: {}", group.id, error);
        }
    }
    if let Some(pool) = &store.pool {
        sqlx::query("DELETE FROM analytics_pipelines WHERE updated_at < NOW() - make_interval(days => $1)")
            .bind(retention_days as i32).execute(pool).await?;
        sqlx::query("DELETE FROM analytics_runner_snapshots WHERE captured_at < NOW() - make_interval(days => $1)")
            .bind(retention_days as i32).execute(pool).await?;
    }
    store.sync_state(None, true).await?;
    Ok(())
}

async fn upsert_project(
    transaction: &mut sqlx::Transaction<'_, sqlx::Postgres>,
    group_id: u64,
    project: &Project,
) -> Result<(), sqlx::Error> {
    sqlx::query(
        r#"INSERT INTO analytics_projects
           (gitlab_id,group_id,name,path,web_url,default_branch,namespace_path,topics,jobs_enabled)
           VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9)
           ON CONFLICT(gitlab_id) DO UPDATE SET group_id=EXCLUDED.group_id,name=EXCLUDED.name,
           path=EXCLUDED.path,web_url=EXCLUDED.web_url,default_branch=EXCLUDED.default_branch,
           namespace_path=EXCLUDED.namespace_path,topics=EXCLUDED.topics,
           jobs_enabled=EXCLUDED.jobs_enabled,last_seen_at=NOW()"#,
    )
    .bind(project.id as i64).bind(group_id as i64).bind(&project.name).bind(&project.path)
    .bind(&project.web_url).bind(&project.default_branch).bind(
        project
            .namespace
            .full_path
            .as_deref()
            .unwrap_or(&project.namespace.path),
    )
    .bind(serde_json::to_value(&project.topics).unwrap_or_else(|_| serde_json::json!([]))).bind(project.jobs_enabled)
    .execute(&mut **transaction).await?;
    Ok(())
}

fn enum_name(value: &impl serde::Serialize) -> String {
    serde_json::to_value(value)
        .ok()
        .and_then(|value| value.as_str().map(str::to_owned))
        .unwrap_or_default()
}
