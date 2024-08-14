use crate::error::ApiError;
use crate::model::Pipeline;
use crate::pipeline::PipelineService;
use actix_web::web;
use actix_web::web::{Data, Json};
use serde::Deserialize;
use serde_querystring_actix::QueryString;

pub fn setup_handlers(cfg: &mut web::ServiceConfig) {
    cfg.route("/pipelines/retry", web::post().to(retry_pipeline));
}

#[derive(Deserialize)]
struct Q {
    project_id: u64,
    pipeline_id: u64,
}

async fn retry_pipeline(
    QueryString(Q {
        project_id,
        pipeline_id,
    }): QueryString<Q>,
    pipeline_service: Data<PipelineService>,
) -> Result<Json<Pipeline>, ApiError> {
    let pipeline = pipeline_service
        .retry_pipeline(project_id, pipeline_id)
        .await?;
    Ok(Json(pipeline))
}
