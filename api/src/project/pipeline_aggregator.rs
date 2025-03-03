use crate::error::ApiError;
use crate::model::{Project, ProjectPipeline, ProjectPipelines};
use crate::pipeline::{sort_by_updated_date, PipelineService};
use crate::project::ProjectService;
use crate::util::iter::try_collect_with_buffer;

pub struct PipelineAggregator {
    project_service: ProjectService,
    pipeline_service: PipelineService,
}

impl PipelineAggregator {
    pub fn new(project_service: ProjectService, pipeline_service: PipelineService) -> Self {
        Self {
            project_service,
            pipeline_service,
        }
    }
}

impl PipelineAggregator {
    pub async fn get_projects_with_latest_pipeline(
        &self,
        group_id: u64,
        project_ids: Option<Vec<u64>>,
    ) -> Result<Vec<ProjectPipeline>, ApiError> {
        let projects = self
            .project_service
            .get_projects(group_id, project_ids)
            .await?;

        let mut result = self.with_latest_pipeline(group_id, projects).await?;

        result.sort_unstable_by(|a, b| {
            sort_by_updated_date(a.pipeline.as_ref(), b.pipeline.as_ref())
        });

        Ok(result)
    }

    async fn with_latest_pipeline(
        &self,
        group_id: u64,
        projects: Vec<Project>,
    ) -> Result<Vec<ProjectPipeline>, ApiError> {
        try_collect_with_buffer(projects, |project| async move {
            let default_branch = project.default_branch.clone();
            let pipeline = if let Some(default_branch) = default_branch {
                self.pipeline_service
                    .get_latest_pipeline(project.id, default_branch)
                    .await?
            } else {
                None
            };

            Ok(ProjectPipeline {
                group_id,
                project,
                pipeline,
            })
        })
        .await
    }

    pub async fn get_projects_with_pipelines(
        &self,
        group_id: u64,
        project_ids: Option<Vec<u64>>,
    ) -> Result<Vec<ProjectPipelines>, ApiError> {
        let projects = self
            .project_service
            .get_projects(group_id, project_ids)
            .await?;
        self.with_pipelines(group_id, projects).await
    }

    async fn with_pipelines(
        &self,
        group_id: u64,
        projects: Vec<Project>,
    ) -> Result<Vec<ProjectPipelines>, ApiError> {
        try_collect_with_buffer(projects, |project| async move {
            let pipelines = if project.default_branch.is_some() {
                self.pipeline_service
                    .get_pipelines(project.id, None)
                    .await?
            } else {
                Vec::default()
            };
            Ok(ProjectPipelines {
                group_id,
                project,
                pipelines,
            })
        })
        .await
    }
}
