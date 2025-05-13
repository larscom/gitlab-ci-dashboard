use crate::config::config_app::AppConfig;
use crate::error::ApiError;
use crate::gitlab::GitlabApi;
use crate::model::Project;
use moka::future::Cache;
use std::sync::Arc;

#[derive(Clone)]
pub struct ProjectService {
    cache: Cache<u64, Vec<Project>>,
    client: Arc<dyn GitlabApi>,
    config: AppConfig,
}

impl ProjectService {
    pub fn new(client: Arc<dyn GitlabApi>, config: AppConfig) -> Self {
        let cache = Cache::builder()
            .time_to_live(config.ttl_project_cache)
            .build();

        Self {
            cache,
            client,
            config,
        }
    }
}

impl ProjectService {
    pub async fn get_projects(
        &self,
        group_id: u64,
        project_ids: Option<Vec<u64>>,
    ) -> Result<Vec<Project>, ApiError> {
        let cached_projects = self
            .cache
            .try_get_with(group_id, async {
                let skip_projects = &self.config.project_skip_ids;                
                let projects = self
                    .client
                    .projects(group_id, self.config.group_include_subgroups)
                    .await?
                    .into_iter()
                    .filter(|project| {
                        skip_projects.is_empty() || !skip_projects.contains(&project.id)
                    })
                    .collect::<Vec<_>>();
                Ok::<Vec<Project>, ApiError>(projects)
            })
            .await
            .map_err(|error| error.as_ref().to_owned())?;

        let projects = match project_ids {
            None => cached_projects,
            Some(project_ids) => cached_projects
                .into_iter()
                .filter(|project| project_ids.contains(&project.id))
                .collect::<Vec<_>>(),
        };

        Ok(projects)
    }
}
