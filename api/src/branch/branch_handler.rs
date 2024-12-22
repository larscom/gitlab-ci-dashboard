use crate::branch::PipelineAggregator;
use crate::error::ApiError;
use crate::model::{Branch, BranchPipeline};
use actix_web::web;
use actix_web::web::{Data, Json};
use serde::Deserialize;
use serde_querystring_actix::QueryString;

use super::BranchService;

pub fn setup_handlers(cfg: &mut web::ServiceConfig) {
    cfg.route(
        "/branches/latest-pipelines",
        web::get().to(get_with_latest_pipeline),
    );
    cfg.route("/branches", web::get().to(get_branches));
}

#[derive(Deserialize)]
struct GetQuery {
    project_id: u64,
}

async fn get_branches(
    QueryString(GetQuery { project_id }): QueryString<GetQuery>,
    branch_service: Data<BranchService>,
) -> Result<Json<Vec<Branch>>, ApiError> {
    let result = branch_service.get_branches(project_id).await?;
    Ok(Json(result))
}

async fn get_with_latest_pipeline(
    QueryString(GetQuery { project_id }): QueryString<GetQuery>,
    aggregator: Data<PipelineAggregator>,
) -> Result<Json<Vec<BranchPipeline>>, ApiError> {
    let result = aggregator
        .get_branches_with_latest_pipeline(project_id)
        .await?;
    Ok(Json(result))
}
