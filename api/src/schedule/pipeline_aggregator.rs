use crate::error::ApiError;
use crate::model::{Project, Schedule, ScheduleProjectPipeline};
use crate::pipeline::PipelineService;
use crate::project::ProjectService;
use crate::schedule::ScheduleService;
use crate::util::iter::try_collect_with_buffer;

pub struct PipelineAggregator {
    schedule_service: ScheduleService,
    project_service: ProjectService,
    pipeline_service: PipelineService,
}

impl PipelineAggregator {
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
}

impl PipelineAggregator {
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
        let result = try_collect_with_buffer(projects, |project| async move {
            let schedules = self.schedule_service.get_schedules(project.id).await?;
            let result = self
                .with_latest_pipeline(group_id, &project, schedules)
                .await?;
            Ok::<Vec<ScheduleProjectPipeline>, ApiError>(result)
        })
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
        try_collect_with_buffer(schedules, |schedule| async move {
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
        .await
    }
}
