use crate::error::ApiError;
use crate::model::RunnerWithJobs;
use crate::runner::RunnerService;
use actix_web::web;
use actix_web::web::{Data, Json};
use serde::Deserialize;
use serde_querystring_actix::QueryString;

pub fn setup_handlers(cfg: &mut web::ServiceConfig) {
    cfg.route("/runners", web::get().to(get_runners));
}

#[derive(Deserialize)]
struct GetQuery {
    group_id: u64,
    refresh: Option<bool>,
}

async fn get_runners(
    QueryString(GetQuery { group_id, refresh }): QueryString<GetQuery>,
    service: Data<RunnerService>,
) -> Result<Json<Vec<RunnerWithJobs>>, ApiError> {
    Ok(Json(
        service
            .get_runners(group_id, refresh.unwrap_or(false))
            .await?,
    ))
}
