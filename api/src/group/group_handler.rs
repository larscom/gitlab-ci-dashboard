use crate::error::ApiError;
use crate::group::service::GroupService;
use crate::model::Group;
use actix_web::web::{Data, Json};
use actix_web::{web, HttpRequest};

pub fn setup_handlers(cfg: &mut web::ServiceConfig) {
    cfg.route("/groups", web::get().to(get_groups));
}

async fn get_groups(
    req: HttpRequest,
    group_service: Data<GroupService>,
) -> Result<Json<Vec<Group>>, ApiError> {
    let result = group_service.get_groups(req.path()).await?;
    Ok(Json(result))
}
