use crate::config::Config;
use crate::error::ApiError;
use crate::gitlab::GitlabApi;
use crate::model::Group;
use moka::future::Cache;
use std::sync::Arc;

pub struct GroupService {
    cache: Cache<String, Vec<Group>>,
    client: Arc<dyn GitlabApi>,
    config: Config,
}

impl GroupService {
    pub fn new(client: Arc<dyn GitlabApi>, config: Config) -> Self {
        let cache = Cache::builder()
            .time_to_live(config.ttl_group_cache)
            .build();

        Self {
            cache,
            client,
            config,
        }
    }
}

impl GroupService {
    pub async fn get_groups(&self, cache_key: &str) -> Result<Vec<Group>, ApiError> {
        let only_ids = &self.config.group_only_ids;
        let skip_groups = &self.config.group_skip_ids;
        let top_level = self.config.group_only_top_level;
        self.cache
            .try_get_with_by_ref(cache_key, async {
                let mut groups = self
                    .client
                    .groups(skip_groups, top_level)
                    .await?
                    .into_iter()
                    .filter(|group| only_ids.is_empty() || only_ids.contains(&group.id))
                    .collect::<Vec<_>>();

                groups.sort_unstable_by(|a, b| a.name.cmp(&b.name));

                Ok::<Vec<Group>, ApiError>(groups)
            })
            .await
            .map_err(|error| error.as_ref().to_owned())
    }
}
