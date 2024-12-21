use crate::error::ApiError;
use actix_web::body::BoxBody;
use actix_web::{web, HttpResponse};
use serde::Deserialize;
use serde_querystring_actix::QueryString;

pub fn setup_handlers(cfg: &mut web::ServiceConfig) {
    cfg.route("/artifacts", web::get().to(get_artifact));
}

#[derive(Deserialize)]
struct GetQuery {
    project_id: u64,
    job_id: u64,
    job_name: String,
}

async fn get_artifact(
    QueryString(GetQuery {
        project_id,
        job_id,
        job_name,
    }): QueryString<GetQuery>,
) -> Result<HttpResponse, ApiError> {
    Ok(HttpResponse::Ok().body(BoxBody::new(vec![])))
}
