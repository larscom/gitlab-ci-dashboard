use crate::config::ApiConfig;
use crate::error::ApiError;
use crate::model::{Pipeline, PipelineSource};
use crate::pipeline::PipelineService;
use actix_web::web;
use actix_web::web::{Data, Json};
use serde::{Deserialize, Serialize};
use serde_querystring_actix::QueryString;
use std::collections::HashMap;

pub fn setup_handlers(cfg: &mut web::ServiceConfig) {
    cfg.route("/pipelines", web::get().to(get_pipelines));
    cfg.route("/pipelines/start", web::post().to(start_pipeline));
    cfg.route("/pipelines/retry", web::post().to(retry_pipeline));
    cfg.route("/pipelines/cancel", web::post().to(cancel_pipeline));
}

#[derive(Deserialize)]
struct GetQuery {
    project_id: u64,
    source: Option<PipelineSource>,
}

async fn get_pipelines(
    QueryString(GetQuery { project_id, source }): QueryString<GetQuery>,
    pipeline_service: Data<PipelineService>,
) -> Result<Json<Vec<Pipeline>>, ApiError> {
    let pipelines = pipeline_service.get_pipelines(project_id, source).await?;
    Ok(Json(pipelines))
}

#[derive(Deserialize)]
struct PostQuery {
    project_id: u64,
    pipeline_id: u64,
}

async fn retry_pipeline(
    QueryString(PostQuery {
        project_id,
        pipeline_id,
    }): QueryString<PostQuery>,
    pipeline_service: Data<PipelineService>,
    api_config: Data<ApiConfig>,
) -> Result<Json<Pipeline>, ApiError> {
    if api_config.read_only {
        return Err(ApiError::bad_request(
            "can't retry pipeline when in 'read only' mode".into(),
        ));
    }

    let pipeline = pipeline_service
        .retry_pipeline(project_id, pipeline_id)
        .await?;

    Ok(Json(pipeline))
}

async fn cancel_pipeline(
    QueryString(PostQuery {
        project_id,
        pipeline_id,
    }): QueryString<PostQuery>,
    pipeline_service: Data<PipelineService>,
    api_config: Data<ApiConfig>,
) -> Result<Json<Pipeline>, ApiError> {
    if api_config.read_only {
        return Err(ApiError::bad_request(
            "can't cancel pipeline when in 'read only' mode".into(),
        ));
    }

    let pipeline = pipeline_service
        .cancel_pipeline(project_id, pipeline_id)
        .await?;

    Ok(Json(pipeline))
}

#[derive(Deserialize, Serialize)]
struct PostBody {
    project_id: u64,
    branch: String,
    env_vars: Option<HashMap<String, String>>,
}

async fn start_pipeline(
    Json(PostBody {
        project_id,
        branch,
        env_vars,
    }): Json<PostBody>,
    pipeline_service: Data<PipelineService>,
    api_config: Data<ApiConfig>,
) -> Result<Json<Pipeline>, ApiError> {
    if api_config.read_only {
        return Err(ApiError::bad_request(
            "can't start a new pipeline when in 'read only' mode".into(),
        ));
    }

    let pipeline = pipeline_service
        .start_pipeline(project_id, branch, env_vars)
        .await?;

    Ok(Json(pipeline))
}
