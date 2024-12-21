use crate::artifact::ArtifactService;
use crate::error::ApiError;
use actix_web::web;
use actix_web::web::{Bytes, Data};
use serde::Deserialize;
use serde_querystring_actix::QueryString;

pub fn setup_handlers(cfg: &mut web::ServiceConfig) {
    cfg.route("/artifacts", web::get().to(get_artifact));
}

#[derive(Deserialize)]
struct GetQuery {
    project_id: u64,
    job_id: u64,
}

async fn get_artifact(
    QueryString(GetQuery { project_id, job_id }): QueryString<GetQuery>,
    artifact_service: Data<ArtifactService>,
) -> Result<Bytes, ApiError> {
    artifact_service.get_artifact(project_id, job_id).await
}
