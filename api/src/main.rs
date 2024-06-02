#![forbid(unsafe_code)]

use actix_web::dev::HttpServiceFactory;
use actix_web::web::Data;
use actix_web::{middleware::Logger, web, App, HttpResponse, HttpServer, Responder};
use actix_web_lab::web::spa;
use actix_web_prom::{PrometheusMetrics, PrometheusMetricsBuilder};
use dotenv::dotenv;
use serde_querystring_actix::{ParseMode, QueryStringConfig};
use web::scope;

use config::Config;

mod branch;
mod config;
mod error;
mod gitlab;
mod group;
mod job;
mod model;
mod pipeline;
mod project;
mod schedule;

async fn version() -> String {
    std::env::var("VERSION").unwrap_or(String::from("dev"))
}

async fn health() -> impl Responder {
    HttpResponse::Ok().finish()
}

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    dotenv().ok();
    env_logger::init();

    log::info!("Gitlab CI Dashboard :: {} ::", version().await);

    let gcd_config = Config::new();
    let qs_config = QueryStringConfig::default().parse_mode(ParseMode::Delimiter(b','));
    let prometheus = setup_prometheus();

    let gitlab_client = gitlab::new_client(&gcd_config);

    let group_service = Data::new(group::new_service(&gitlab_client, &gcd_config));
    let pipeline_service = Data::new(pipeline::new_service(&gitlab_client, &gcd_config));
    let project_service = Data::new(project::new_service(&gitlab_client, &gcd_config));
    let job_service = Data::new(job::new_service(&gitlab_client, &gcd_config));
    let project_aggr = Data::new(project::new_aggregator(&project_service, &pipeline_service));
    let branch_aggr = Data::new(branch::new_aggregator(
        &gitlab_client,
        &pipeline_service,
        &gcd_config,
    ));
    let schedule_aggr = Data::new(schedule::new_aggregator(
        &gitlab_client,
        &project_service,
        &pipeline_service,
        &gcd_config,
    ));

    HttpServer::new(move || {
        App::new()
            .wrap(Logger::default())
            .wrap(prometheus.clone())
            .app_data(qs_config.clone())
            .app_data(group_service.clone())
            .app_data(project_aggr.clone())
            .app_data(branch_aggr.clone())
            .app_data(schedule_aggr.clone())
            .app_data(job_service.clone())
            .route("/health", web::get().to(health))
            .service(
                scope("/api")
                    .route("/version", web::get().to(version))
                    .configure(group::setup_groups)
                    .configure(project::setup_projects)
                    .configure(branch::setup_branches)
                    .configure(schedule::setup_schedules)
                    .configure(job::setup_jobs),
            )
            .service(setup_spa())
    })
    .bind((gcd_config.server_ip, gcd_config.server_port))?
    .workers(gcd_config.server_workers)
    .run()
    .await
}

fn setup_prometheus() -> PrometheusMetrics {
    PrometheusMetricsBuilder::new(String::default().as_str())
        .endpoint("/metrics/prometheus")
        .build()
        .expect("failed to create prometheus endpoint")
}

fn setup_spa() -> impl HttpServiceFactory {
    if cfg!(debug_assertions) {
        spa().finish()
    } else {
        spa()
            .index_file("./spa/index.html")
            .static_resources_mount("/")
            .static_resources_location("./spa")
            .finish()
    }
}
