#![forbid(unsafe_code)]

use actix_web::{App, HttpResponse, HttpServer, middleware::Logger, Responder, web};
use actix_web::dev::HttpServiceFactory;
use actix_web::web::{Data, Json, ServiceConfig};
use actix_web_lab::web::spa;
use actix_web_prom::{PrometheusMetrics, PrometheusMetricsBuilder};
use dotenv::dotenv;
use serde_querystring_actix::{ParseMode, QueryStringConfig};
use web::scope;

use config::Config;

use crate::config::ApiConfig;
use crate::group::GroupService;
use crate::job::JobService;
use crate::pipeline::PipelineService;

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

async fn api_config_handler(api_config: Data<ApiConfig>) -> Json<ApiConfig> {
    let config = api_config.as_ref();
    Json(config.clone())
}

async fn health_handler() -> impl Responder {
    HttpResponse::Ok().finish()
}

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    dotenv().ok();
    env_logger::init();

    let gcd_config = Config::new();
    let api_config = ApiConfig::new();
    log::info!(
        "Gitlab CI Dashboard :: {} ::",
        api_config.api_version.clone()
    );

    let api_config = Data::new(api_config);
    let qs_config = QueryStringConfig::default().parse_mode(ParseMode::Delimiter(b','));
    let p_metrics = setup_prometheus();

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
            .wrap(p_metrics.clone())
            .configure(configure_app(
                &api_config,
                &qs_config,
                &group_service,
                &project_aggr,
                &branch_aggr,
                &schedule_aggr,
                &job_service,
                &pipeline_service,
            ))
    })
    .bind((gcd_config.server_ip, gcd_config.server_port))?
    .workers(gcd_config.server_workers)
    .run()
    .await
}

#[allow(clippy::too_many_arguments)]
fn configure_app<'a>(
    api_config: &'a Data<ApiConfig>,
    qs_config: &'a QueryStringConfig,
    group_service: &'a Data<GroupService>,
    project_aggr: &'a Data<project::pipeline::Aggregator>,
    branch_aggr: &'a Data<branch::pipeline::Aggregator>,
    schedule_aggr: &'a Data<schedule::pipeline::Aggregator>,
    job_service: &'a Data<JobService>,
    pipeline_service: &'a Data<PipelineService>,
) -> impl Fn(&mut ServiceConfig) + 'a {
    move |config| {
        config
            .app_data(api_config.clone())
            .app_data(qs_config.clone())
            .app_data(group_service.clone())
            .app_data(project_aggr.clone())
            .app_data(branch_aggr.clone())
            .app_data(schedule_aggr.clone())
            .app_data(job_service.clone())
            .app_data(pipeline_service.clone())
            .route("/health", web::get().to(health_handler))
            .service(
                scope("/api")
                    .route("/config", web::get().to(api_config_handler))
                    .configure(group::setup_handlers)
                    .configure(project::setup_handlers)
                    .configure(pipeline::setup_handlers)
                    .configure(branch::setup_handlers)
                    .configure(schedule::setup_handlers)
                    .configure(job::setup_handlers),
            )
            .service(setup_spa());
    }
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

#[cfg(test)]
mod tests {
    use std::env;
    use std::sync::Arc;

    use actix_web::body::to_bytes;
    use actix_web::test;
    use async_trait::async_trait;
    use chrono::{DateTime, Utc};

    use crate::error::ApiError;
    use crate::gitlab::GitlabApi;
    use crate::model::{
        Branch, BranchPipeline, Group, Job, JobStatus, Pipeline, Project, ProjectPipeline,
        ProjectPipelines, Schedule, ScheduleProjectPipeline,
    };

    use super::*;

    #[macro_export]
    macro_rules! setup_app {
        () => {{
            use super::*;
            use actix_web::{test, App};

            env::set_var("GITLAB_BASE_URL", "https://gitlab.url");
            env::set_var("GITLAB_API_TOKEN", "token123");

            let gcd_config = Config::new();
            let qs_config = QueryStringConfig::default().parse_mode(ParseMode::Delimiter(b','));

            let gitlab_client = new_test_client();

            let api_config = Data::new(ApiConfig::new());
            let group_service = Data::new(group::new_service(&gitlab_client, &gcd_config));
            let pipeline_service = Data::new(pipeline::new_service(&gitlab_client, &gcd_config));
            let project_service = Data::new(project::new_service(&gitlab_client, &gcd_config));
            let job_service = Data::new(job::new_service(&gitlab_client, &gcd_config));
            let project_aggr =
                Data::new(project::new_aggregator(&project_service, &pipeline_service));
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

            test::init_service(App::new().configure(configure_app(
                &api_config,
                &qs_config,
                &group_service,
                &project_aggr,
                &branch_aggr,
                &schedule_aggr,
                &job_service,
                &pipeline_service,
            )))
            .await
        }};
    }

    struct GitlabClientTest {}

    #[async_trait]
    impl GitlabApi for GitlabClientTest {
        async fn groups(
            &self,
            _skip_groups: &[u64],
            _top_level: bool,
        ) -> Result<Vec<Group>, ApiError> {
            Ok(vec![model::test::new_group()])
        }

        async fn projects(&self, _group_id: u64) -> Result<Vec<Project>, ApiError> {
            Ok(vec![model::test::new_project()])
        }

        async fn latest_pipeline(
            &self,
            _project_id: u64,
            _branch: String,
        ) -> Result<Option<Pipeline>, ApiError> {
            Ok(Some(model::test::new_pipeline()))
        }

        async fn pipelines(
            &self,
            _project_id: u64,
            _updated_after: Option<DateTime<Utc>>,
        ) -> Result<Vec<Pipeline>, ApiError> {
            Ok(vec![model::test::new_pipeline()])
        }

        async fn retry_pipeline(
            &self,
            _project_id: u64,
            _pipeline_id: u64,
        ) -> Result<Pipeline, ApiError> {
            Ok(model::test::new_pipeline())
        }

        async fn branches(&self, _project_id: u64) -> Result<Vec<Branch>, ApiError> {
            Ok(vec![model::test::new_branch()])
        }

        async fn schedules(&self, _project_id: u64) -> Result<Vec<Schedule>, ApiError> {
            Ok(vec![model::test::new_schedule()])
        }

        async fn jobs(
            &self,
            _project_id: u64,
            _pipeline_id: u64,
            _scope: &[JobStatus],
        ) -> Result<Vec<Job>, ApiError> {
            Ok(vec![model::test::new_job()])
        }
    }

    fn new_test_client() -> Arc<dyn GitlabApi> {
        Arc::new(GitlabClientTest {})
    }

    fn to_str(value: &[u8]) -> &str {
        std::str::from_utf8(value).expect("failed to read bytes")
    }

    #[actix_web::test]
    async fn test_config_endpoint() {
        env::set_var("VERSION", "1.0.0");

        let app = setup_app!();
        let req = test::TestRequest::get().uri("/api/config").to_request();
        let resp = test::call_service(&app, req).await;

        let status = resp.status();
        assert!(status.is_success());

        let body = to_bytes(resp.into_body()).await.unwrap();
        let result = serde_json::from_str::<ApiConfig>(to_str(&body)).unwrap();

        assert_eq!(result.api_version, "1.0.0");
    }

    #[actix_web::test]
    async fn test_health_endpoint() {
        let app = setup_app!();
        let req = test::TestRequest::get().uri("/health").to_request();
        let resp = test::call_service(&app, req).await;

        assert!(resp.status().is_success());
    }

    #[actix_web::test]
    async fn test_groups_endpoint() {
        let app = setup_app!();
        let req = test::TestRequest::get().uri("/api/groups").to_request();
        let resp = test::call_service(&app, req).await;

        let status = resp.status();
        assert!(status.is_success());
    }

    #[actix_web::test]
    async fn test_projects_with_latest_pipelines_endpoint() {
        let app = setup_app!();
        let req = test::TestRequest::get()
            .uri("/api/projects/latest-pipelines?group_id=1")
            .to_request();
        let resp = test::call_service(&app, req).await;

        let status = resp.status();
        assert!(status.is_success());

        let body = to_bytes(resp.into_body()).await.unwrap();

        let result = serde_json::from_str::<Vec<ProjectPipeline>>(to_str(&body)).unwrap();
        assert_eq!(result.len(), 1);

        let first_entry = &result[0];
        let project = first_entry.clone().project;
        let pipeline = first_entry.clone().pipeline.unwrap();

        assert_eq!(project.id, 456);
        assert_eq!(pipeline.id, 1);
    }

    #[actix_web::test]
    async fn test_projects_with_pipelines_endpoint() {
        let app = setup_app!();
        let req = test::TestRequest::get()
            .uri("/api/projects/pipelines?group_id=1")
            .to_request();
        let resp = test::call_service(&app, req).await;

        let status = resp.status();
        assert!(status.is_success());

        let body = to_bytes(resp.into_body()).await.unwrap();

        let result = serde_json::from_str::<Vec<ProjectPipelines>>(to_str(&body)).unwrap();
        assert_eq!(result.len(), 1);

        let first_entry = &result[0];
        let project = first_entry.clone().project;
        assert_eq!(project.id, 456);

        let pipelines = first_entry.clone().pipelines;
        assert_eq!(pipelines.len(), 1);

        assert_eq!(pipelines[0].id, 1);
    }

    #[actix_web::test]
    async fn test_branches_with_latest_pipelines_endpoint() {
        let app = setup_app!();
        let req = test::TestRequest::get()
            .uri("/api/branches/latest-pipelines?project_id=456")
            .to_request();
        let resp = test::call_service(&app, req).await;

        let status = resp.status();
        assert!(status.is_success());

        let body = to_bytes(resp.into_body()).await.unwrap();

        let result = serde_json::from_str::<Vec<BranchPipeline>>(to_str(&body)).unwrap();
        assert_eq!(result.len(), 1);

        let first_entry = &result[0];
        let branch = first_entry.clone().branch;
        let pipeline = first_entry.clone().pipeline.unwrap();

        assert_eq!(branch.name, "branch-1");
        assert_eq!(pipeline.id, 1);
    }

    #[actix_web::test]
    async fn test_schedules_with_latest_pipelines_endpoint() {
        let app = setup_app!();
        let req = test::TestRequest::get()
            .uri("/api/schedules/latest-pipelines?group_id=1")
            .to_request();
        let resp = test::call_service(&app, req).await;

        let status = resp.status();
        assert!(status.is_success());

        let body = to_bytes(resp.into_body()).await.unwrap();

        let result = serde_json::from_str::<Vec<ScheduleProjectPipeline>>(to_str(&body)).unwrap();
        assert_eq!(result.len(), 1);

        let first_entry = &result[0];
        let schedule = first_entry.clone().schedule;
        let project = first_entry.clone().project;
        let pipeline = first_entry.clone().pipeline.unwrap();

        assert_eq!(schedule.id, 789);
        assert_eq!(project.id, 456);
        assert_eq!(pipeline.id, 1);
    }

    #[actix_web::test]
    async fn test_jobs_endpoint() {
        let app = setup_app!();
        let req = test::TestRequest::get()
            .uri("/api/jobs?project_id=456&pipeline_id=1&scope=running")
            .to_request();
        let resp = test::call_service(&app, req).await;

        let status = resp.status();
        assert!(status.is_success());

        let body = to_bytes(resp.into_body()).await.unwrap();
        let jobs = serde_json::from_str::<Vec<Job>>(to_str(&body)).unwrap();
        assert_eq!(jobs.len(), 1);

        assert_eq!(jobs[0].id, 1);
    }
}
