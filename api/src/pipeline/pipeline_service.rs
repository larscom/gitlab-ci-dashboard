use crate::config::config_app::AppConfig;
use crate::error::ApiError;
use crate::gitlab::GitlabApi;
use crate::model::{Pipeline, PipelineSource};
use chrono::{Duration, Utc};
use moka::future::Cache;
use std::collections::HashMap;
use std::sync::Arc;

#[derive(Debug, Clone, PartialEq, Eq, Hash)]
pub struct CacheKey {
    project_id: u64,
    branch: String,
}

impl CacheKey {
    pub fn new(project_id: u64, branch: String) -> Self {
        Self { project_id, branch }
    }
}

#[derive(Clone)]
pub struct PipelineService {
    cache_latest: Cache<CacheKey, Option<Pipeline>>,
    cache_all: Cache<u64, Vec<Pipeline>>,
    client: Arc<dyn GitlabApi>,
    config: AppConfig,
}

impl PipelineService {
    pub fn new(client: Arc<dyn GitlabApi>, config: AppConfig) -> Self {
        let cache_latest = Cache::builder()
            .time_to_live(config.ttl_pipeline_cache)
            .build();
        let cache_all = Cache::builder()
            .time_to_live(config.ttl_pipeline_cache)
            .build();
        Self {
            cache_latest,
            cache_all,
            client,
            config,
        }
    }
}

impl PipelineService {
    pub async fn retry_pipeline(
        &self,
        project_id: u64,
        pipeline_id: u64,
    ) -> Result<Pipeline, ApiError> {
        self.client.retry_pipeline(project_id, pipeline_id).await
    }

    pub async fn start_pipeline(
        &self,
        project_id: u64,
        branch: String,
        env_vars: Option<HashMap<String, String>>,
    ) -> Result<Pipeline, ApiError> {
        self.client
            .start_pipeline(project_id, branch, env_vars)
            .await
    }

    pub async fn cancel_pipeline(
        &self,
        project_id: u64,
        pipeline_id: u64,
    ) -> Result<Pipeline, ApiError> {
        self.client.cancel_pipeline(project_id, pipeline_id).await
    }

    pub async fn get_latest_pipeline(
        &self,
        project_id: u64,
        branch: String,
    ) -> Result<Option<Pipeline>, ApiError> {
        if let Some(pipelines) = self.cache_all.get(&project_id).await {
            if let Some(pipeline) = pipelines
                .into_iter()
                .filter(|pipeline| pipeline.branch == branch)
                .max_by(|a, b| a.updated_at.cmp(&b.updated_at))
            {
                return Ok(Some(pipeline));
            }
        }

        self.cache_latest
            .try_get_with(CacheKey::new(project_id, branch.clone()), async {
                self.client.latest_pipeline(project_id, branch).await
            })
            .await
            .map_err(|error| error.as_ref().to_owned())
    }

    pub async fn get_pipelines(
        &self,
        project_id: u64,
        source: Option<PipelineSource>,
    ) -> Result<Vec<Pipeline>, ApiError> {
        let minus_days = self.config.pipeline_history_days;
        let updated_after = Utc::now() + Duration::days(-minus_days);
        let all_pipelines = self
            .cache_all
            .try_get_with(project_id, async {
                self.client.pipelines(project_id, Some(updated_after)).await
            })
            .await
            .map_err(|error| error.as_ref().to_owned());

        match source {
            None => all_pipelines,
            Some(source) => all_pipelines.map(|pipelines| {
                pipelines
                    .into_iter()
                    .filter(|p| p.source == source)
                    .collect()
            }),
        }
    }

    pub async fn get_newest_pipelines_by_branch(
        &self,
        project_id: u64,
        refresh: bool,
    ) -> Result<Vec<Pipeline>, ApiError> {
        if refresh {
            self.cache_all.invalidate(&project_id).await;
        } else if let Some(pipelines) = self.cache_all.get(&project_id).await {
            if !pipelines.iter().any(|pipeline| is_active(&pipeline.status)) {
                return Ok(latest_by_branch(pipelines));
            }
            self.cache_all.invalidate(&project_id).await;
        }

        self.get_pipelines(project_id, None)
            .await
            .map(latest_by_branch)
    }
}

fn latest_by_branch(pipelines: Vec<Pipeline>) -> Vec<Pipeline> {
    let mut newest = HashMap::<String, Pipeline>::new();

    for pipeline in pipelines {
        newest
            .entry(pipeline.branch.clone())
            .and_modify(|current| {
                if pipeline.updated_at > current.updated_at {
                    *current = pipeline.clone();
                }
            })
            .or_insert(pipeline);
    }

    let mut pipelines = newest.into_values().collect::<Vec<_>>();
    pipelines.sort_unstable_by(|a, b| b.updated_at.cmp(&a.updated_at));
    pipelines
}

fn is_active(status: &crate::model::PipelineStatus) -> bool {
    matches!(
        status,
        crate::model::PipelineStatus::Created
            | crate::model::PipelineStatus::Pending
            | crate::model::PipelineStatus::Running
            | crate::model::PipelineStatus::Canceling
            | crate::model::PipelineStatus::Preparing
            | crate::model::PipelineStatus::WaitingForResource
    )
}
