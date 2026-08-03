use crate::analytics::AnalyticsStore;
use crate::error::ApiError;
use crate::job::JobService;
use crate::model::{JobStatus, PipelineStatus, Project, ProjectPipeline, ProjectPipelines};
use crate::pipeline::{sort_by_updated_date, PipelineService};
use crate::project::ProjectService;
use crate::util::iter::try_collect_with_buffer;

pub struct PipelineAggregator {
    project_service: ProjectService,
    pipeline_service: PipelineService,
    job_service: JobService,
    analytics: AnalyticsStore,
}

impl PipelineAggregator {
    pub fn new(
        project_service: ProjectService,
        pipeline_service: PipelineService,
        job_service: JobService,
        analytics: AnalyticsStore,
    ) -> Self {
        Self {
            project_service,
            pipeline_service,
            job_service,
            analytics,
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

            let failed_jobs = match pipeline {
                Some(ref p) if p.status == PipelineStatus::Failed => Some(
                    self.job_service
                        .get_jobs(p.project_id, p.id, &[JobStatus::Failed])
                        .await?,
                ),
                _ => None,
            };

            Ok(ProjectPipeline {
                group_id,
                project,
                pipeline,
                failed_jobs,
            })
        })
        .await
    }

    pub async fn get_projects_with_pipelines(
        &self,
        group_id: u64,
        project_ids: Option<Vec<u64>>,
        refresh: bool,
    ) -> Result<Vec<ProjectPipelines>, ApiError> {
        let projects = self
            .project_service
            .get_projects(group_id, project_ids)
            .await?;
        let result = self.with_pipelines(group_id, projects, refresh).await?;
        if let Err(error) = self.analytics.persist(&result).await {
            log::error!("Could not persist pipeline analytics for group {group_id}: {error}");
        }
        Ok(result)
    }

    async fn with_pipelines(
        &self,
        group_id: u64,
        projects: Vec<Project>,
        refresh: bool,
    ) -> Result<Vec<ProjectPipelines>, ApiError> {
        try_collect_with_buffer(projects, |project| async move {
            let pipelines = if project.default_branch.is_some() && project.jobs_enabled {
                match self
                    .pipeline_service
                    .get_newest_pipelines_by_branch(project.id, refresh)
                    .await
                {
                    Ok(pipelines) => pipelines,
                    Err(error) if error.is_too_many_requests() => {
                        log::warn!(
                            "GitLab rate-limited pipelines for project {}; returning an empty \
                             pipeline list so other projects can still load",
                            project.id
                        );
                        Vec::new()
                    }
                    Err(error) => return Err(error),
                }
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
