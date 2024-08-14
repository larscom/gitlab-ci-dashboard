use crate::config::ApiConfig;
use crate::error::ApiError;
use crate::model::Pipeline;
use crate::pipeline::PipelineService;
use actix_web::web;
use actix_web::web::{Data, Json};
use serde::{Deserialize, Serialize};
use serde_querystring_actix::QueryString;
use std::collections::HashMap;

pub fn setup_handlers(cfg: &mut web::ServiceConfig) {
    cfg.route("/pipelines/retry", web::post().to(retry_pipeline))
        .route("/pipelines/create", web::post().to(create_pipeline));
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

#[derive(Deserialize, Serialize)]
struct B {
    project_id: u64,
    branch: String,
    env_vars: Option<HashMap<String, String>>,
}

async fn create_pipeline(
    Json(B {
        project_id,
        branch,
        env_vars,
    }): Json<B>,
    _pipeline_service: Data<PipelineService>,
    api_config: Data<ApiConfig>,
) -> Result<Json<B>, ApiError> {
    if api_config.read_only {
        return Err(ApiError::bad_request(
            "can't create pipeline when in 'read only' mode".into(),
        ));
    }

    Ok(Json(B {
        project_id,
        branch,
        env_vars,
    }))
}
