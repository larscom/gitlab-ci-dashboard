use std::sync::Arc;
use std::time::Duration;

use actix_web::{web, HttpRequest};
use moka::future::Cache;
use web::{Data, Json};

use crate::config::Config;
use crate::error::ApiError;
use crate::gitlab::{GitlabApi, GitlabClient};
use crate::model::Group;

pub fn new_service(gitlab_client: &Arc<GitlabClient>, config: &Config) -> GroupService {
    GroupService::new(
        gitlab_client.clone(),
        new_cache(config.ttl_group_cache),
        config.clone(),
    )
}

pub fn setup_groups(cfg: &mut web::ServiceConfig) {
    cfg.route("/groups", web::get().to(get_groups));
}

pub async fn get_groups(
    req: HttpRequest,
    group_service: Data<GroupService>,
) -> Result<Json<Vec<Group>>, ApiError> {
    let result = group_service.get_groups(req.path()).await?;
    Ok(Json(result))
}

pub struct GroupService {
    cache: Cache<String, Vec<Group>>,
    client: Arc<dyn GitlabApi + Send + Sync>,
    config: Config,
}

impl GroupService {
    pub fn new(
        client: Arc<dyn GitlabApi + Send + Sync>,
        cache: Cache<String, Vec<Group>>,
        config: Config,
    ) -> Self {
        Self {
            cache,
            client,
            config,
        }
    }

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

fn new_cache(ttl: Duration) -> Cache<String, Vec<Group>> {
    Cache::builder().time_to_live(ttl).build()
}
