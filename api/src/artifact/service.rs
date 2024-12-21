use crate::config::Config;
use crate::error::ApiError;
use crate::gitlab::GitlabApi;
use actix_web::web::Bytes;
use moka::future::Cache;
use std::sync::Arc;

#[derive(Debug, Clone, PartialEq, Eq, Hash)]
pub struct CacheKey {
    project_id: u64,
    job_id: u64,
}

impl CacheKey {
    pub fn new(project_id: u64, job_id: u64) -> Self {
        Self { project_id, job_id }
    }
}
#[derive(Clone)]
pub struct ArtifactService {
    cache: Cache<CacheKey, Bytes>,
    client: Arc<dyn GitlabApi>,
}

impl ArtifactService {
    pub fn new(client: Arc<dyn GitlabApi>, config: Config) -> Self {
        let cache = Cache::builder()
            .time_to_live(config.ttl_artifact_cache)
            .build();

        Self { cache, client }
    }
}

impl ArtifactService {
    pub async fn get_artifact(&self, project_id: u64, job_id: u64) -> Result<Bytes, ApiError> {
        self.cache
            .try_get_with(CacheKey::new(project_id, job_id), async {
                self.client.artifact(project_id, job_id).await
            })
            .await
            .map_err(|error| error.as_ref().to_owned())
    }
}
