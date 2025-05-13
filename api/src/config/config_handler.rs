use actix_web::web;
use actix_web::web::{Data, Json};
use crate::config::config_app::ApiConfig;

pub fn setup_handlers(cfg: &mut web::ServiceConfig) {
    cfg.route("/config", web::get().to(get_api_config));
}

async fn get_api_config(api_config: Data<ApiConfig>) -> Json<ApiConfig> {
    let config = api_config.as_ref();
    Json(config.clone())
}