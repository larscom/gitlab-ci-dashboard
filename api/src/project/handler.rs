use crate::error::ApiError;
use crate::model::{ProjectPipeline, ProjectPipelines};
use crate::project::PipelineAggregator;
use actix_web::web;
use actix_web::web::{Data, Json};
use serde::Deserialize;
use serde_querystring_actix::QueryString;

pub fn setup_handlers(cfg: &mut web::ServiceConfig) {
    cfg.route(
        "/projects/latest-pipelines",
        web::get().to(get_with_latest_pipeline),
    )
    .route("/projects/pipelines", web::get().to(get_with_pipelines));
}

#[derive(Deserialize)]
struct Q {
    group_id: u64,
    project_ids: Option<Vec<u64>>,
}

async fn get_with_latest_pipeline(
    QueryString(Q {
        group_id,
        project_ids,
    }): QueryString<Q>,
    aggregator: Data<PipelineAggregator>,
) -> Result<Json<Vec<ProjectPipeline>>, ApiError> {
    let result = aggregator
        .get_projects_with_latest_pipeline(group_id, project_ids)
        .await?;
    Ok(Json(result))
}

async fn get_with_pipelines(
    QueryString(Q {
        group_id,
        project_ids,
    }): QueryString<Q>,
    aggregator: Data<PipelineAggregator>,
) -> Result<Json<Vec<ProjectPipelines>>, ApiError> {
    let result = aggregator
        .get_projects_with_pipelines(group_id, project_ids)
        .await?;
    Ok(Json(result))
}
