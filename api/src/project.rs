use std::sync::Arc;
use std::time::Duration;

use actix_web::web;
use moka::future::Cache;
use serde::Deserialize;
use web::{Data, Json, Query};

use crate::config::Config;
use crate::error::ApiError;
use crate::gitlab::GitlabApi;
use crate::model::{Project, ProjectPipeline, ProjectPipelines};
use crate::pipeline::PipelineService;
use crate::project::pipeline::Aggregator;

pub fn new_aggregator(
    project_service: &ProjectService,
    pipeline_service: &PipelineService,
) -> Aggregator {
    Aggregator::new(project_service.clone(), pipeline_service.clone())
}

pub fn new_service(
    gitlab_client: &Arc<dyn GitlabApi + Send + Sync>,
    config: &Config,
) -> ProjectService {
    ProjectService::new(
        gitlab_client.clone(),
        new_cache(config.ttl_project_cache),
        config.clone(),
    )
}

pub fn setup_projects(cfg: &mut web::ServiceConfig) {
    cfg.route(
        "/projects/latest-pipelines",
        web::get().to(get_with_latest_pipeline),
    )
    .route("/projects/pipelines", web::get().to(get_with_pipelines));
}

#[derive(Deserialize)]
struct QueryParams {
    group_id: u64,
}

#[allow(private_interfaces)]
pub async fn get_with_latest_pipeline(
    Query(QueryParams { group_id }): Query<QueryParams>,
    aggregator: Data<Aggregator>,
) -> Result<Json<Vec<ProjectPipeline>>, ApiError> {
    let result = aggregator
        .get_projects_with_latest_pipeline(group_id)
        .await?;
    Ok(Json(result))
}

#[allow(private_interfaces)]
pub async fn get_with_pipelines(
    Query(QueryParams { group_id }): Query<QueryParams>,
    aggregator: Data<Aggregator>,
) -> Result<Json<Vec<ProjectPipelines>>, ApiError> {
    let result = aggregator.get_projects_with_pipelines(group_id).await?;
    Ok(Json(result))
}

#[derive(Clone)]
pub struct ProjectService {
    cache: Cache<u64, Vec<Project>>,
    client: Arc<dyn GitlabApi + Send + Sync>,
    config: Config,
}

impl ProjectService {
    pub fn new(
        client: Arc<dyn GitlabApi + Send + Sync>,
        cache: Cache<u64, Vec<Project>>,
        config: Config,
    ) -> Self {
        Self {
            cache,
            client,
            config,
        }
    }

    pub async fn get_projects(&self, group_id: u64) -> Result<Vec<Project>, ApiError> {
        let skip_projects = &self.config.project_skip_ids;
        self.cache
            .try_get_with(group_id, async {
                let projects = self
                    .client
                    .projects(group_id)
                    .await?
                    .into_iter()
                    .filter(|project| {
                        skip_projects.is_empty() || !skip_projects.contains(&project.id)
                    })
                    .collect::<Vec<_>>();
                Ok::<Vec<Project>, ApiError>(projects)
            })
            .await
            .map_err(|error| error.as_ref().to_owned())
    }
}

fn new_cache(ttl: Duration) -> Cache<u64, Vec<Project>> {
    Cache::builder().time_to_live(ttl).build()
}

pub mod pipeline {
    use futures::stream::{iter, StreamExt, TryStreamExt};

    use pipeline::sort_by_updated_date;

    use crate::error::ApiError;
    use crate::model::{Project, ProjectPipeline, ProjectPipelines};
    use crate::pipeline;
    use crate::pipeline::PipelineService;
    use crate::project::ProjectService;

    pub struct Aggregator {
        project_service: ProjectService,
        pipeline_service: PipelineService,
    }

    impl Aggregator {
        pub fn new(project_service: ProjectService, pipeline_service: PipelineService) -> Self {
            Self {
                project_service,
                pipeline_service,
            }
        }

        pub async fn get_projects_with_latest_pipeline(
            &self,
            group_id: u64,
        ) -> Result<Vec<ProjectPipeline>, ApiError> {
            let projects = self.project_service.get_projects(group_id).await?;
            let mut result = self.with_latest_pipeline(projects).await?;

            result.sort_unstable_by(|a, b| {
                sort_by_updated_date(a.pipeline.as_ref(), b.pipeline.as_ref())
            });

            Ok(result)
        }

        async fn with_latest_pipeline(
            &self,
            projects: Vec<Project>,
        ) -> Result<Vec<ProjectPipeline>, ApiError> {
            if projects.is_empty() {
                return Ok(vec![]);
            }

            let buffer = projects.len();
            iter(projects.iter())
                .map(|project| async {
                    let pipeline = self
                        .pipeline_service
                        .get_latest_pipeline(project.id, project.default_branch.clone())
                        .await?;
                    let project = project.clone();
                    Ok(ProjectPipeline { project, pipeline })
                })
                .buffered(buffer)
                .try_collect()
                .await
        }

        pub async fn get_projects_with_pipelines(
            &self,
            group_id: u64,
        ) -> Result<Vec<ProjectPipelines>, ApiError> {
            let projects = self.project_service.get_projects(group_id).await?;
            self.with_pipelines(projects).await
        }

        async fn with_pipelines(
            &self,
            projects: Vec<Project>,
        ) -> Result<Vec<ProjectPipelines>, ApiError> {
            if projects.is_empty() {
                return Ok(vec![]);
            }

            let buffer = projects.len();
            iter(projects.iter())
                .map(|project| async {
                    let pipelines = self.pipeline_service.get_pipelines(project.id).await?;
                    let project = project.clone();
                    Ok(ProjectPipelines { project, pipelines })
                })
                .buffered(buffer)
                .try_collect()
                .await
        }
    }
}
