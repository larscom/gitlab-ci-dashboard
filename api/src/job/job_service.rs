use crate::config::config_app::AppConfig;
use crate::error::ApiError;
use crate::gitlab::GitlabApi;
use crate::model::{Job, JobStatus};
use moka::future::Cache;
use std::sync::Arc;

#[derive(Debug, Clone, PartialEq, Eq, Hash)]
pub struct CacheKey {
    project_id: u64,
    pipeline_id: u64,
    scope: Vec<JobStatus>,
}

impl CacheKey {
    pub fn new(project_id: u64, pipeline_id: u64, scope: Vec<JobStatus>) -> Self {
        Self {
            project_id,
            pipeline_id,
            scope,
        }
    }
}

#[derive(Clone)]
pub struct JobService {
    cache: Cache<CacheKey, Vec<Job>>,
    client: Arc<dyn GitlabApi>,
}

impl JobService {
    pub fn new(client: Arc<dyn GitlabApi>, config: AppConfig) -> Self {
        let cache = Cache::builder().time_to_live(config.ttl_job_cache).build();

        Self { cache, client }
    }
}

impl JobService {
    pub async fn get_jobs(
        &self,
        project_id: u64,
        pipeline_id: u64,
        scope: &[JobStatus],
    ) -> Result<Vec<Job>, ApiError> {
        self.cache
            .try_get_with(
                CacheKey::new(project_id, pipeline_id, scope.to_vec()),
                async {
                    self.client
                        .jobs(project_id, pipeline_id, scope)
                        .await
                        .map(|mut jobs| {
                            jobs.sort_unstable_by(|a, b| a.created_at.cmp(&b.created_at));
                            jobs
                        })
                },
            )
            .await
            .map_err(|error| error.as_ref().to_owned())
    }
}
