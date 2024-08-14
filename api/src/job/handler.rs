use crate::error::ApiError;
use crate::job::JobService;
use crate::model::{Job, JobStatus};
use actix_web::web;
use actix_web::web::{Data, Json};
use serde::Deserialize;
use serde_querystring_actix::QueryString;

pub fn setup_handlers(cfg: &mut web::ServiceConfig) {
    cfg.route("/jobs", web::get().to(get_jobs));
}

#[derive(Deserialize)]
struct Q {
    project_id: u64,
    pipeline_id: u64,
    scope: Vec<JobStatus>,
}

async fn get_jobs(
    QueryString(Q {
        project_id,
        pipeline_id,
        scope,
    }): QueryString<Q>,
    job_service: Data<JobService>,
) -> Result<Json<Vec<Job>>, ApiError> {
    let result = job_service
        .get_jobs(project_id, pipeline_id, &scope)
        .await?;
    Ok(Json(result))
}
