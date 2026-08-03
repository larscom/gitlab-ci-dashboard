use super::AnalyticsStore;
use crate::error::ApiError;
use crate::model::ProjectPipelines;
use actix_web::web::{Data, Json};
use serde::Deserialize;
use serde_querystring_actix::QueryString;

#[derive(Deserialize)]
pub(super) struct PipelinesQuery {
    group_id: u64,
    project_ids: Option<Vec<u64>>,
    hours: Option<i32>,
}

pub(super) async fn get_pipelines(
    QueryString(query): QueryString<PipelinesQuery>,
    store: Data<AnalyticsStore>,
) -> Result<Json<Vec<ProjectPipelines>>, ApiError> {
    let Some(pool) = &store.pool else {
        return Ok(Json(Vec::new()));
    };
    let hours = query.hours.unwrap_or(24).clamp(1, 24 * 365);
    let project_ids = query
        .project_ids
        .map(|ids| ids.into_iter().map(|id| id as i64).collect::<Vec<_>>());
    let payload = sqlx::query_scalar::<_, serde_json::Value>(
        r#"SELECT COALESCE(jsonb_agg(entry ORDER BY project_name), '[]'::jsonb)
           FROM (
             SELECT pr.name AS project_name, jsonb_build_object(
               'group_id', pr.group_id,
               'project', jsonb_build_object(
                 'id', pr.gitlab_id,
                 'name', pr.name,
                 'path', pr.path,
                 'web_url', pr.web_url,
                 'default_branch', pr.default_branch,
                 'topics', pr.topics,
                 'namespace', jsonb_build_object(
                   'id', 0,
                   'name', pr.namespace_path,
                   'path', pr.namespace_path,
                   'full_path', pr.namespace_path
                 ),
                 'jobs_enabled', pr.jobs_enabled
               ),
               'pipelines', COALESCE((
                 SELECT jsonb_agg(jsonb_build_object(
                   'id', p.gitlab_id,
                   'iid', p.iid,
                   'project_id', p.project_id,
                   'coverage', p.coverage,
                   'sha', p.sha,
                   'ref', p.branch,
                   'status', p.status,
                   'source', p.source,
                   'created_at', p.created_at,
                   'updated_at', p.updated_at,
                   'web_url', p.web_url
                 ) ORDER BY p.updated_at DESC)
                 FROM analytics_pipelines p
                 WHERE p.project_id = pr.gitlab_id
                   AND p.updated_at >= NOW() - make_interval(hours => $2)
               ), '[]'::jsonb)
             ) AS entry
             FROM analytics_projects pr
             WHERE pr.group_id = $1
               AND ($3::bigint[] IS NULL OR pr.gitlab_id = ANY($3))
           ) projects"#,
    )
    .bind(query.group_id as i64)
    .bind(hours)
    .bind(project_ids)
    .fetch_one(pool)
    .await
    .map_err(database_error)?;

    serde_json::from_value(payload)
        .map(Json)
        .map_err(|error| {
            log::error!("Could not deserialize persisted pipelines: {error}");
            ApiError::server_error("Could not load persisted pipelines")
        })
}

fn database_error(error: sqlx::Error) -> ApiError {
    log::error!("Could not query persisted pipelines: {error}");
    ApiError::server_error("Could not load persisted pipelines")
}
