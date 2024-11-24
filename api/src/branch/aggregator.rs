use crate::branch::service::BranchService;
use crate::error::ApiError;
use crate::model::{Branch, BranchPipeline};
use crate::pipeline;
use crate::pipeline::PipelineService;
use crate::util::iter::try_collect_with_buffer;
use pipeline::sort_by_updated_date;

pub struct PipelineAggregator {
    branch_service: BranchService,
    pipeline_service: PipelineService,
}

impl PipelineAggregator {
    pub fn new(branch_service: BranchService, pipeline_service: PipelineService) -> Self {
        Self {
            branch_service,
            pipeline_service,
        }
    }
}

impl PipelineAggregator {
    pub async fn get_branches_with_latest_pipeline(
        &self,
        project_id: u64,
    ) -> Result<Vec<BranchPipeline>, ApiError> {
        let branches = self.branch_service.get_branches(project_id).await?;
        let mut result = self.get_latest_pipelines(project_id, branches).await?;

        result.sort_unstable_by(|a, b| {
            sort_by_updated_date(a.pipeline.as_ref(), b.pipeline.as_ref())
        });

        Ok(result)
    }

    async fn get_latest_pipelines(
        &self,
        project_id: u64,
        branches: Vec<Branch>,
    ) -> Result<Vec<BranchPipeline>, ApiError> {
        try_collect_with_buffer(branches, |branch| async move {
            let pipeline = self
                .pipeline_service
                .get_latest_pipeline(project_id, branch.name.clone())
                .await?;
            Ok(BranchPipeline { branch, pipeline })
        })
        .await
    }
}
