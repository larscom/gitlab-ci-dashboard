use std::sync::Arc;
use std::time::Duration;

use actix_web::web;
use moka::future::Cache;
use serde::Deserialize;
use serde_querystring_actix::QueryString;
use web::{Data, Json};

use crate::branch::pipeline::Aggregator;
use crate::config::Config;
use crate::error::ApiError;
use crate::gitlab::GitlabApi;
use crate::model::{Branch, BranchPipeline};
use crate::pipeline::PipelineService;

pub fn new_aggregator(
    gitlab_client: Arc<dyn GitlabApi>,
    pipeline_service: &PipelineService,
    config: &Config,
) -> Aggregator {
    Aggregator::new(
        BranchService::new(gitlab_client, new_cache(config.ttl_branch_cache)),
        pipeline_service.clone(),
    )
}

pub fn setup_handlers(cfg: &mut web::ServiceConfig) {
    cfg.route(
        "/branches/latest-pipelines",
        web::get().to(get_with_latest_pipeline),
    );
}

#[derive(Deserialize)]
struct Q {
    project_id: u64,
}

#[allow(private_interfaces)]
pub async fn get_with_latest_pipeline(
    QueryString(Q { project_id }): QueryString<Q>,
    aggregator: Data<Aggregator>,
) -> Result<Json<Vec<BranchPipeline>>, ApiError> {
    let result = aggregator
        .get_branches_with_latest_pipeline(project_id)
        .await?;
    Ok(Json(result))
}

pub struct BranchService {
    cache: Cache<u64, Vec<Branch>>,
    client: Arc<dyn GitlabApi>,
}

impl BranchService {
    pub fn new(client: Arc<dyn GitlabApi>, cache: Cache<u64, Vec<Branch>>) -> Self {
        Self { cache, client }
    }

    pub async fn get_branches(&self, project_id: u64) -> Result<Vec<Branch>, ApiError> {
        self.cache
            .try_get_with(project_id, async { self.client.branches(project_id).await })
            .await
            .map_err(|error| error.as_ref().to_owned())
    }
}

fn new_cache(ttl: Duration) -> Cache<u64, Vec<Branch>> {
    Cache::builder().time_to_live(ttl).build()
}

pub mod pipeline {
    use futures::stream::{iter, StreamExt, TryStreamExt};

    use pipeline::sort_by_updated_date;

    use crate::branch::BranchService;
    use crate::error::ApiError;
    use crate::model::{Branch, BranchPipeline};
    use crate::pipeline;
    use crate::pipeline::PipelineService;

    pub struct Aggregator {
        branch_service: BranchService,
        pipeline_service: PipelineService,
    }

    impl Aggregator {
        pub fn new(branch_service: BranchService, pipeline_service: PipelineService) -> Self {
            Self {
                branch_service,
                pipeline_service,
            }
        }

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
            if branches.is_empty() {
                return Ok(vec![]);
            }

            let buffer = branches.len();
            iter(branches.iter())
                .map(|branch| async {
                    let pipeline = self
                        .pipeline_service
                        .get_latest_pipeline(project_id, branch.name.clone())
                        .await?;
                    let branch = branch.clone();
                    Ok(BranchPipeline { branch, pipeline })
                })
                .buffered(buffer)
                .try_collect()
                .await
        }
    }
}
