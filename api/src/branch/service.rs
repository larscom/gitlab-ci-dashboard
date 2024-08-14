use crate::config::Config;
use crate::error::ApiError;
use crate::gitlab::GitlabApi;
use crate::model::Branch;
use moka::future::Cache;
use std::sync::Arc;

pub struct BranchService {
    cache: Cache<u64, Vec<Branch>>,
    client: Arc<dyn GitlabApi>,
}

impl BranchService {
    pub fn new(client: Arc<dyn GitlabApi>, config: Config) -> Self {
        let cache = Cache::builder()
            .time_to_live(config.ttl_branch_cache)
            .build();

        Self { cache, client }
    }
}

impl BranchService {
    pub async fn get_branches(&self, project_id: u64) -> Result<Vec<Branch>, ApiError> {
        self.cache
            .try_get_with(project_id, async { self.client.branches(project_id).await })
            .await
            .map_err(|error| error.as_ref().to_owned())
    }
}
