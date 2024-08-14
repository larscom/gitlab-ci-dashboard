use crate::branch::PipelineAggregator;
use crate::error::ApiError;
use crate::model::BranchPipeline;
use actix_web::web;
use actix_web::web::{Data, Json};
use serde::Deserialize;
use serde_querystring_actix::QueryString;

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

async fn get_with_latest_pipeline(
    QueryString(Q { project_id }): QueryString<Q>,
    aggregator: Data<PipelineAggregator>,
) -> Result<Json<Vec<BranchPipeline>>, ApiError> {
    let result = aggregator
        .get_branches_with_latest_pipeline(project_id)
        .await?;
    Ok(Json(result))
}
