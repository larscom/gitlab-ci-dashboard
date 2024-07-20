use std::sync::Arc;
use std::time::Duration;

use actix_web::web;
use moka::future::Cache;
use serde::Deserialize;
use serde_querystring_actix::QueryString;
use web::{Data, Json};

use crate::config::Config;
use crate::error::ApiError;
use crate::gitlab::GitlabApi;
use crate::model::{Schedule, ScheduleProjectPipeline};
use crate::pipeline::PipelineService;
use crate::project::ProjectService;
use crate::schedule::pipeline::Aggregator;

pub fn new_aggregator(
    gitlab_client: Arc<dyn GitlabApi>,
    project_service: &ProjectService,
    pipeline_service: &PipelineService,
    config: &Config,
) -> Aggregator {
    Aggregator::new(
        ScheduleService::new(gitlab_client, new_cache(config.ttl_schedule_cache)),
        project_service.clone(),
        pipeline_service.clone(),
    )
}

pub fn new_cache(ttl: Duration) -> Cache<u64, Vec<Schedule>> {
    Cache::builder().time_to_live(ttl).build()
}

pub fn setup_handlers(cfg: &mut web::ServiceConfig) {
    cfg.route(
        "/schedules/latest-pipelines",
        web::get().to(get_with_latest_pipeline),
    );
}

#[derive(Deserialize)]
struct Q {
    group_id: u64,
    project_ids: Option<Vec<u64>>,
}

#[allow(private_interfaces)]
pub async fn get_with_latest_pipeline(
    QueryString(Q {
        group_id,
        project_ids,
    }): QueryString<Q>,
    aggregator: Data<Aggregator>,
) -> Result<Json<Vec<ScheduleProjectPipeline>>, ApiError> {
    let result = aggregator
        .get_schedules_with_latest_pipeline(group_id, project_ids)
        .await?;
    Ok(Json(result))
}

pub struct ScheduleService {
    cache: Cache<u64, Vec<Schedule>>,
    client: Arc<dyn GitlabApi>,
}

impl ScheduleService {
    pub fn new(client: Arc<dyn GitlabApi>, cache: Cache<u64, Vec<Schedule>>) -> Self {
        Self { cache, client }
    }

    pub async fn get_schedules(&self, project_id: u64) -> Result<Vec<Schedule>, ApiError> {
        self.cache
            .try_get_with(project_id, async {
                self.client.schedules(project_id).await
            })
            .await
            .map_err(|error| error.as_ref().to_owned())
    }
}

pub mod pipeline {
    use futures::stream::{iter, StreamExt, TryStreamExt};

    use crate::error::ApiError;
    use crate::model::{Project, Schedule, ScheduleProjectPipeline};
    use crate::pipeline::PipelineService;
    use crate::project::ProjectService;
    use crate::schedule::ScheduleService;

    pub struct Aggregator {
        schedule_service: ScheduleService,
        project_service: ProjectService,
        pipeline_service: PipelineService,
    }

    impl Aggregator {
        pub fn new(
            schedule_service: ScheduleService,
            project_service: ProjectService,
            pipeline_service: PipelineService,
        ) -> Self {
            Self {
                schedule_service,
                project_service,
                pipeline_service,
            }
        }

        pub async fn get_schedules_with_latest_pipeline(
            &self,
            group_id: u64,
            project_ids: Option<Vec<u64>>,
        ) -> Result<Vec<ScheduleProjectPipeline>, ApiError> {
            let projects = self
                .project_service
                .get_projects(group_id, project_ids)
                .await?;

            let mut result = self.get_schedules(group_id, projects).await?;

            result.sort_unstable_by(|a, b| a.schedule.id.cmp(&b.schedule.id));

            Ok(result)
        }

        async fn get_schedules(
            &self,
            group_id: u64,
            projects: Vec<Project>,
        ) -> Result<Vec<ScheduleProjectPipeline>, ApiError> {
            if projects.is_empty() {
                return Ok(vec![]);
            }

            let buffer = projects.len();
            let result = iter(projects.iter())
                .map(|project| async {
                    let schedules = self.schedule_service.get_schedules(project.id).await?;
                    let result = self
                        .with_latest_pipeline(group_id, project, schedules)
                        .await?;
                    Ok::<Vec<ScheduleProjectPipeline>, ApiError>(result)
                })
                .buffered(buffer)
                .try_collect::<Vec<Vec<ScheduleProjectPipeline>>>()
                .await?
                .into_iter()
                .flatten()
                .collect();

            Ok(result)
        }

        async fn with_latest_pipeline(
            &self,
            group_id: u64,
            project: &Project,
            schedules: Vec<Schedule>,
        ) -> Result<Vec<ScheduleProjectPipeline>, ApiError> {
            if schedules.is_empty() {
                return Ok(vec![]);
            }

            let buffer = schedules.len();
            iter(schedules.iter())
                .map(|schedule| async {
                    let project = project.clone();
                    let pipeline = self
                        .pipeline_service
                        .get_latest_pipeline(project.id, schedule.branch.clone())
                        .await?;
                    let schedule = schedule.clone();
                    Ok(ScheduleProjectPipeline {
                        group_id,
                        schedule,
                        pipeline,
                        project,
                    })
                })
                .buffered(buffer)
                .try_collect()
                .await
        }
    }
}
