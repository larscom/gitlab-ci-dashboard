#![forbid(unsafe_code)]

use crate::gitlab::GitlabClient;
use crate::spa::Spa;
use actix_web::dev::HttpServiceFactory;
use actix_web::web::{Data, ServiceConfig};
use actix_web::{middleware::Logger, web, App, HttpResponse, HttpServer, Responder};
use actix_web_prom::{PrometheusMetrics, PrometheusMetricsBuilder};
use config::config_app;
use dotenv::dotenv;
use serde_querystring_actix::{ParseMode, QueryStringConfig};
use std::sync::Arc;
use web::scope;

mod artifact;
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
mod spa;
mod util;

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    dotenv().ok();
    env_logger::init();

    let gcd_config = config_app::AppConfig::load();
    let api_config = config_app::ApiConfig::load();

    let api_version = api_config.api_version.clone();
    log::info!("Gitlab CI Dashboard :: {} ::", api_version);

    let api_config = Data::new(api_config);
    let qs_config = QueryStringConfig::default().parse_mode(ParseMode::Delimiter(b','));

    let gitlab_client = Arc::new(GitlabClient::new(
        gcd_config.gitlab_url.clone(),
        gcd_config.gitlab_token.clone(),
    ));

    let group_service = Data::new(group::GroupService::new(
        gitlab_client.clone(),
        gcd_config.clone(),
    ));
    let pipeline_service = Data::new(pipeline::PipelineService::new(
        gitlab_client.clone(),
        gcd_config.clone(),
    ));
    let project_service = Data::new(project::ProjectService::new(
        gitlab_client.clone(),
        gcd_config.clone(),
    ));
    let job_service = Data::new(job::JobService::new(
        gitlab_client.clone(),
        gcd_config.clone(),
    ));
    let branch_service = Data::new(branch::BranchService::new(
        gitlab_client.clone(),
        gcd_config.clone(),
    ));
    let artifact_service = Data::new(artifact::ArtifactService::new(
        gitlab_client.clone(),
        gcd_config.clone(),
    ));

    let project_aggr = Data::new(project::PipelineAggregator::new(
        project_service.get_ref().clone(),
        pipeline_service.get_ref().clone(),
    ));
    let branch_aggr = Data::new(branch::PipelineAggregator::new(
        branch_service.get_ref().clone(),
        pipeline_service.get_ref().clone(),
    ));
    let schedule_aggr = Data::new(schedule::PipelineAggregator::new(
        schedule::ScheduleService::new(gitlab_client.clone(), gcd_config.clone()),
        project_service.get_ref().clone(),
        pipeline_service.get_ref().clone(),
    ));

    let prom = setup_prometheus();

    HttpServer::new(move || {
        App::new()
            .wrap(Logger::default())
            .wrap(prom.clone())
            .configure(configure_app(
                api_config.clone(),
                qs_config.clone(),
                group_service.clone(),
                project_aggr.clone(),
                branch_aggr.clone(),
                schedule_aggr.clone(),
                job_service.clone(),
                pipeline_service.clone(),
                branch_service.clone(),
                artifact_service.clone(),
            ))
    })
    .bind((gcd_config.server_ip, gcd_config.server_port))?
    .workers(gcd_config.server_workers)
    .run()
    .await
}

#[allow(clippy::too_many_arguments)]
fn configure_app(
    api_config: Data<config_app::ApiConfig>,
    qs_config: QueryStringConfig,
    group_service: Data<group::GroupService>,
    project_aggr: Data<project::PipelineAggregator>,
    branch_aggr: Data<branch::PipelineAggregator>,
    schedule_aggr: Data<schedule::PipelineAggregator>,
    job_service: Data<job::JobService>,
    pipeline_service: Data<pipeline::PipelineService>,
    branch_service: Data<branch::BranchService>,
    artifact_service: Data<artifact::ArtifactService>,
) -> impl FnOnce(&mut ServiceConfig) {
    move |config| {
        config
            .app_data(api_config)
            .app_data(qs_config)
            .app_data(group_service)
            .app_data(project_aggr)
            .app_data(branch_aggr)
            .app_data(schedule_aggr)
            .app_data(job_service)
            .app_data(pipeline_service)
            .app_data(branch_service)
            .app_data(artifact_service)
            .route("/health", web::get().to(health_handler))
            .service(
                scope("/api")
                    .configure(config::setup_handlers)
                    .configure(group::setup_handlers)
                    .configure(project::setup_handlers)
                    .configure(pipeline::setup_handlers)
                    .configure(branch::setup_handlers)
                    .configure(schedule::setup_handlers)
                    .configure(job::setup_handlers)
                    .configure(artifact::setup_handlers),
            )
            .service(setup_spa());
    }
}

async fn health_handler() -> impl Responder {
    HttpResponse::Ok().finish()
}

fn setup_prometheus() -> PrometheusMetrics {
    PrometheusMetricsBuilder::new(String::default().as_str())
        .endpoint("/metrics/prometheus")
        .build()
        .expect("prometheus endpoint to be created")
}

fn setup_spa() -> impl HttpServiceFactory {
    if cfg!(debug_assertions) {
        Spa::default().finish()
    } else {
        Spa::new("./spa/index.html", "/", "./spa").finish()
    }
}

#[cfg(test)]
mod tests {
    use actix_web::body::to_bytes;
    use actix_web::test;
    use actix_web::web::Bytes;
    use async_trait::async_trait;
    use chrono::{DateTime, Utc};
    use serde_json::json;
    use std::collections::HashMap;
    use std::env;
    use std::ops::Deref;

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
            env::set_var("API_READ_ONLY", "false");

            let gcd_config = config_app::AppConfig::new();
            let qs_config = QueryStringConfig::default().parse_mode(ParseMode::Delimiter(b','));

            let gitlab_client = Arc::new(GitlabClientTest {});

            let api_config = Data::new(config_app::ApiConfig::new());

            let group_service = Data::new(group::GroupService::new(
                gitlab_client.clone(),
                gcd_config.clone(),
            ));
            let pipeline_service = Data::new(pipeline::PipelineService::new(
                gitlab_client.clone(),
                gcd_config.clone(),
            ));
            let project_service = Data::new(project::ProjectService::new(
                gitlab_client.clone(),
                gcd_config.clone(),
            ));
            let job_service = Data::new(job::JobService::new(
                gitlab_client.clone(),
                gcd_config.clone(),
            ));
            let branch_service = Data::new(branch::BranchService::new(
                gitlab_client.clone(),
                gcd_config.clone(),
            ));
            let artifact_service = Data::new(artifact::ArtifactService::new(
                gitlab_client.clone(),
                gcd_config.clone(),
            ));

            let project_aggr = Data::new(project::PipelineAggregator::new(
                project_service.get_ref().clone(),
                pipeline_service.get_ref().clone(),
            ));
            let branch_aggr = Data::new(branch::PipelineAggregator::new(
                branch_service.get_ref().clone(),
                pipeline_service.get_ref().clone(),
            ));
            let schedule_aggr = Data::new(schedule::PipelineAggregator::new(
                schedule::ScheduleService::new(gitlab_client.clone(), gcd_config.clone()),
                project_service.get_ref().clone(),
                pipeline_service.get_ref().clone(),
            ));

            test::init_service(App::new().configure(configure_app(
                api_config,
                qs_config,
                group_service,
                project_aggr,
                branch_aggr,
                schedule_aggr,
                job_service,
                pipeline_service,
                branch_service,
                artifact_service,
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

        async fn projects(
            &self,
            _group_id: u64,
            _include_subgroups: bool,
        ) -> Result<Vec<Project>, ApiError> {
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

        async fn start_pipeline(
            &self,
            _project_id: u64,
            _branch: String,
            _env_vars: Option<HashMap<String, String>>,
        ) -> Result<Pipeline, ApiError> {
            Ok(model::test::new_pipeline())
        }

        async fn cancel_pipeline(
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

        async fn artifact(&self, _project_id: u64, _job_id: u64) -> Result<Bytes, ApiError> {
            Ok(Bytes::from("hello".to_string()))
        }
    }

    fn to_str(value: &[u8]) -> &str {
        std::str::from_utf8(value).expect("str to be created from bytes")
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
        let result = serde_json::from_str::<config_app::ApiConfig>(to_str(&body)).unwrap();

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
    async fn test_branches_endpoint() {
        let app = setup_app!();
        let req = test::TestRequest::get()
            .uri("/api/branches?project_id=456")
            .to_request();
        let resp = test::call_service(&app, req).await;

        let status = resp.status();
        assert!(status.is_success());

        let body = to_bytes(resp.into_body()).await.unwrap();
        let branches = serde_json::from_str::<Vec<Branch>>(to_str(&body)).unwrap();

        assert_eq!(branches.len(), 1);
        assert_eq!(branches[0].name, "branch-1");
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

    #[actix_web::test]
    async fn test_pipelines_endpoint() {
        let app = setup_app!();
        let req = test::TestRequest::get()
            .uri("/api/pipelines?project_id=456&source=web")
            .to_request();
        let resp = test::call_service(&app, req).await;

        let status = resp.status();
        assert!(status.is_success());

        let body = to_bytes(resp.into_body()).await.unwrap();
        let pipelines = serde_json::from_str::<Vec<Pipeline>>(to_str(&body)).unwrap();
        assert_eq!(pipelines.len(), 1);

        assert_eq!(pipelines[0].id, 1);
    }

    #[actix_web::test]
    async fn test_retry_pipeline_endpoint() {
        let app = setup_app!();
        let req = test::TestRequest::post()
            .uri("/api/pipelines/retry?project_id=456&pipeline_id=1")
            .to_request();
        let resp = test::call_service(&app, req).await;

        let status = resp.status();
        assert!(status.is_success());

        let body = to_bytes(resp.into_body()).await.unwrap();
        let pipeline = serde_json::from_str::<Pipeline>(to_str(&body)).unwrap();
        assert_eq!(pipeline.id, 1);
    }

    #[actix_web::test]
    async fn test_cancel_pipeline_endpoint() {
        let app = setup_app!();
        let req = test::TestRequest::post()
            .uri("/api/pipelines/cancel?project_id=456&pipeline_id=1")
            .to_request();
        let resp = test::call_service(&app, req).await;

        let status = resp.status();
        assert!(status.is_success());

        let body = to_bytes(resp.into_body()).await.unwrap();
        let pipeline = serde_json::from_str::<Pipeline>(to_str(&body)).unwrap();
        assert_eq!(pipeline.id, 1);
    }

    #[actix_web::test]
    async fn test_start_pipeline_endpoint() {
        let app = setup_app!();
        let body = json!({
            "project_id": 1,
            "branch": "main",
            "env_vars": {
                "key1": "value1"
            }
        });
        let req = test::TestRequest::post()
            .uri("/api/pipelines/start")
            .set_json(body)
            .to_request();
        let resp = test::call_service(&app, req).await;

        let status = resp.status();
        assert!(status.is_success());

        let body = to_bytes(resp.into_body()).await.unwrap();
        let pipeline = serde_json::from_str::<Pipeline>(to_str(&body)).unwrap();
        assert_eq!(pipeline.id, 1);
    }

    #[actix_web::test]
    async fn test_artifact_endpoint() {
        let app = setup_app!();
        let req = test::TestRequest::get()
            .uri("/api/artifacts?project_id=456&job_id=1")
            .to_request();
        let resp = test::call_service(&app, req).await;

        let status = resp.status();
        assert!(status.is_success());

        let body = to_bytes(resp.into_body()).await.unwrap();

        assert_eq!(String::from_utf8_lossy(body.deref()), "hello");
    }
}
