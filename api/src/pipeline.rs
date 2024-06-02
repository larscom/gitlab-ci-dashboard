use std::cmp::Ordering;
use std::sync::Arc;

use chrono::{Duration, Utc};
use moka::future::Cache;

use crate::config::Config;
use crate::error::ApiError;
use crate::gitlab::GitlabApi;
use crate::model::Pipeline;
use crate::pipeline::latest::CacheKey;

pub fn new_service(
    gitlab_client: &Arc<dyn GitlabApi + Send + Sync>,
    config: &Config,
) -> PipelineService {
    PipelineService::new(
        gitlab_client.clone(),
        latest::new_cache(config.ttl_latest_pipeline_cache),
        new_cache(config.ttl_latest_pipeline_cache),
        config.clone(),
    )
}

#[derive(Clone)]
pub struct PipelineService {
    cache_latest: Cache<CacheKey, Option<Pipeline>>,
    cache_all: Cache<u64, Vec<Pipeline>>,
    client: Arc<dyn GitlabApi + Send + Sync>,
    config: Config,
}

impl PipelineService {
    pub fn new(
        client: Arc<dyn GitlabApi + Send + Sync>,
        cache_latest: Cache<CacheKey, Option<Pipeline>>,
        cache_all: Cache<u64, Vec<Pipeline>>,
        config: Config,
    ) -> Self {
        Self {
            cache_latest,
            cache_all,
            client,
            config,
        }
    }

    pub async fn get_latest_pipeline(
        &self,
        project_id: u64,
        branch: String,
    ) -> Result<Option<Pipeline>, ApiError> {
        self.cache_latest
            .try_get_with(CacheKey::new(project_id, branch.clone()), async {
                self.client.latest_pipeline(project_id, branch).await
            })
            .await
            .map_err(|error| error.as_ref().to_owned())
    }

    pub async fn get_pipelines(&self, project_id: u64) -> Result<Vec<Pipeline>, ApiError> {
        let minus_days = self.config.pipeline_history_days;
        let updated_after = Utc::now() + Duration::days(-minus_days);
        self.cache_all
            .try_get_with(project_id, async {
                self.client.pipelines(project_id, Some(updated_after)).await
            })
            .await
            .map_err(|error| error.as_ref().to_owned())
    }
}

pub fn sort_by_updated_date(a: Option<&Pipeline>, b: Option<&Pipeline>) -> Ordering {
    match (a, b) {
        (Some(a), Some(b)) => b.updated_at.cmp(&a.updated_at),
        (None, Some(_)) => Ordering::Less,
        (Some(_), None) => Ordering::Greater,
        _ => Ordering::Equal,
    }
}

fn new_cache(ttl: std::time::Duration) -> Cache<u64, Vec<Pipeline>> {
    Cache::builder().time_to_live(ttl).build()
}

pub mod latest {
    use std::time::Duration;

    use moka::future::Cache;

    use crate::model::Pipeline;

    pub fn new_cache(ttl: Duration) -> Cache<CacheKey, Option<Pipeline>> {
        Cache::builder().time_to_live(ttl).build()
    }

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
}
