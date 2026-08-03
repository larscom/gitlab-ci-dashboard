#![forbid(unsafe_code)]

use crate::config::config_app::{ApiConfig, AppConfig};
use crate::config::config_file;
use crate::federated_gitlab::FederatedGitlabClient;
use crate::spa::Spa;
use actix_web::dev::HttpServiceFactory;
use actix_web::web::{Data, ServiceConfig};
use actix_web::{middleware::Logger, web, App, HttpResponse, HttpServer, Responder};
use actix_web_prom::{PrometheusMetrics, PrometheusMetricsBuilder};
use serde_querystring_actix::{ParseMode, QueryStringConfig};
use std::sync::Arc;
use web::scope;

mod analytics;
mod artifact;
mod auth;
mod branch;
mod config;
mod error;
mod environment;
mod gitlab;
mod federated_gitlab;
mod group;
mod job;
mod model;
mod pipeline;
mod project;
mod runner;
mod schedule;
mod spa;
mod util;

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    env_logger::init();

    let file_config = config_file::FileConfig::load_from_toml().map_err(|error| {
        let message = match error { config_file::Error::Read => "config.toml is required".to_string(), config_file::Error::Deserialize(message) => message };
        std::io::Error::new(std::io::ErrorKind::InvalidData, message)
    })?;
    let app_config = AppConfig::from_file(&file_config);
    let api_config = ApiConfig::from_file(&file_config);

    let analytics_store = analytics::AnalyticsStore::connect(
        app_config.analytics_enabled,
        app_config.database_url.as_deref(),
        app_config.database_max_connections,
    )
    .await
    .map_err(std::io::Error::other)?;

    log::info!("Gitlab CI Dashboard :: {} ::", &api_config.api_version);

    log::debug!("{app_config:?}");
    log::debug!("{api_config:?}");

    let api_config = Data::new(api_config);
    let qs_config = QueryStringConfig::default().parse_mode(ParseMode::Delimiter(b','));

    let pool = analytics_store.pool().ok_or_else(|| std::io::Error::other("Database must be enabled for Web-managed GitLab environments"))?;
    let auth_state = Data::new(auth::AuthState::new(pool.clone(), &file_config.authentication).await.map_err(std::io::Error::other)?);
    let environment_store = environment::EnvironmentStore::new(
        pool,
        &file_config.security.environment_token_encryption_key,
    ).map_err(std::io::Error::other)?;
    let federated_client = Arc::new(FederatedGitlabClient::new(
        environment_store.clients().await.map_err(std::io::Error::other)?
    ));
    let gitlab_client: Arc<dyn crate::gitlab::GitlabApi> = federated_client.clone();
    let environment_store = Data::new(environment_store);
    let federated_client = Data::new(federated_client);

    let group_service = Data::new(group::GroupService::new(
        gitlab_client.clone(),
        app_config.clone(),
    ));
    let pipeline_service = Data::new(pipeline::PipelineService::new(
        gitlab_client.clone(),
        app_config.clone(),
    ));
    let project_service = Data::new(project::ProjectService::new(
        gitlab_client.clone(),
        app_config.clone(),
    ));
    let job_service = Data::new(job::JobService::new(
        gitlab_client.clone(),
        app_config.clone(),
    ));
    let branch_service = Data::new(branch::BranchService::new(
        gitlab_client.clone(),
        app_config.clone(),
    ));
    let artifact_service = Data::new(artifact::ArtifactService::new(
        gitlab_client.clone(),
        app_config.clone(),
    ));
    let runner_service = Data::new(runner::RunnerService::new(
        gitlab_client.clone(),
        app_config.clone(),
        analytics_store.clone(),
    ));

    let project_aggr = Data::new(project::PipelineAggregator::new(
        project_service.get_ref().clone(),
        pipeline_service.get_ref().clone(),
        job_service.get_ref().clone(),
        analytics_store.clone(),
    ));
    let branch_aggr = Data::new(branch::PipelineAggregator::new(
        branch_service.get_ref().clone(),
        pipeline_service.get_ref().clone(),
        job_service.get_ref().clone(),
    ));
    let schedule_aggr = Data::new(schedule::PipelineAggregator::new(
        schedule::ScheduleService::new(gitlab_client.clone(), app_config.clone()),
        project_service.get_ref().clone(),
        pipeline_service.get_ref().clone(),
        job_service.get_ref().clone(),
    ));

    let analytics_store_data = Data::new(analytics_store.clone());
    analytics::spawn_sync(
        analytics_store,
        group_service.clone(),
        project_aggr.clone(),
        runner_service.clone(),
        app_config.analytics_sync_interval,
        app_config.analytics_retention_days,
    );

    let prom = setup_prometheus();

    HttpServer::new(move || {
        App::new()
            .wrap(Logger::default())
            .wrap(prom.clone())
            .configure(configure_app(
                api_config.clone(),
                analytics_store_data.clone(),
                environment_store.clone(),
                federated_client.clone(),
                auth_state.clone(),
                qs_config.clone(),
                group_service.clone(),
                project_aggr.clone(),
                branch_aggr.clone(),
                schedule_aggr.clone(),
                job_service.clone(),
                pipeline_service.clone(),
                branch_service.clone(),
                artifact_service.clone(),
                runner_service.clone(),
            ))
    })
    .bind((app_config.server_ip, app_config.server_port))?
    .workers(app_config.server_workers)
    .run()
    .await
}

#[allow(clippy::too_many_arguments)]
fn configure_app(
    api_config: Data<ApiConfig>,
    analytics_store: Data<analytics::AnalyticsStore>,
    environment_store: Data<environment::EnvironmentStore>,
    federated_client: Data<Arc<FederatedGitlabClient>>,
    auth_state: Data<auth::AuthState>,
    qs_config: QueryStringConfig,
    group_service: Data<group::GroupService>,
    project_aggr: Data<project::PipelineAggregator>,
    branch_aggr: Data<branch::PipelineAggregator>,
    schedule_aggr: Data<schedule::PipelineAggregator>,
    job_service: Data<job::JobService>,
    pipeline_service: Data<pipeline::PipelineService>,
    branch_service: Data<branch::BranchService>,
    artifact_service: Data<artifact::ArtifactService>,
    runner_service: Data<runner::RunnerService>,
) -> impl FnOnce(&mut ServiceConfig) {
    move |config| {
        config
            .app_data(api_config)
            .app_data(analytics_store)
            .app_data(environment_store)
            .app_data(federated_client)
            .app_data(auth_state)
            .app_data(qs_config)
            .app_data(group_service)
            .app_data(project_aggr)
            .app_data(branch_aggr)
            .app_data(schedule_aggr)
            .app_data(job_service)
            .app_data(pipeline_service)
            .app_data(branch_service)
            .app_data(artifact_service)
            .app_data(runner_service)
            .route("/health", web::get().to(health_handler))
            .service(scope("/api/auth").configure(auth::setup_handlers))
            .service(
                scope("/api")
                    .wrap_fn(|request, service| {
                        use actix_service::Service;
                        use futures::future::{ready, Either};
                        use futures::FutureExt;

                        let authenticated = request
                            .app_data::<Data<auth::AuthState>>()
                            .map(|auth| auth.is_authenticated(request.request()))
                            .unwrap_or(false);

                        if authenticated {
                            Either::Left(
                                service
                                    .call(request)
                                    .map(|response| response.map(|response| response.map_into_left_body())),
                            )
                        } else {
                            let response = HttpResponse::Unauthorized()
                                .json(serde_json::json!({ "message": "Authentication required" }));
                            Either::Right(ready(Ok(
                                request.into_response(response).map_into_right_body()
                            )))
                        }
                    })
                    .configure(environment::setup_handlers)
                    .configure(auth::setup_user_handlers)
                    .configure(analytics::setup_handlers)
                    .configure(config::setup_handlers)
                    .configure(group::setup_handlers)
                    .configure(project::setup_handlers)
                    .configure(pipeline::setup_handlers)
                    .configure(branch::setup_handlers)
                    .configure(schedule::setup_handlers)
                    .configure(job::setup_handlers)
                    .configure(artifact::setup_handlers)
                    .configure(runner::setup_handlers),
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
        Branch, BranchPipeline, Bridge, Group, Job, JobStatus, Pipeline, Project, ProjectPipeline,
        ProjectPipelines, Runner, RunnerJob, RunnerManager, RunnerWithJobs, Schedule,
        ScheduleProjectPipeline,
    };

    use super::*;

    #[macro_export]
    macro_rules! setup_app {
        () => {{
            use super::*;
            use actix_web::{test, App};

            env::set_var("GLCIDBR__GITLAB_BASE_URL", "https://gitlab.url");
            env::set_var("GLCIDBR__GITLAB_API_TOKEN", "token123");
            env::set_var("GLCIDBR__API_READ_ONLY", "false");

            let gcd_config = AppConfig::new();
            let qs_config = QueryStringConfig::default().parse_mode(ParseMode::Delimiter(b','));

            let gitlab_client = Arc::new(GitlabClientTest {});

            let api_config = Data::new(ApiConfig::new());
            let auth_state = Data::new(auth::AuthState::for_test());

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
            let runner_service = Data::new(runner::RunnerService::new(
                gitlab_client.clone(),
                gcd_config.clone(),
                analytics::AnalyticsStore::default(),
            ));

            let project_aggr = Data::new(project::PipelineAggregator::new(
                project_service.get_ref().clone(),
                pipeline_service.get_ref().clone(),
                job_service.get_ref().clone(),
                analytics::AnalyticsStore::default(),
            ));
            let branch_aggr = Data::new(branch::PipelineAggregator::new(
                branch_service.get_ref().clone(),
                pipeline_service.get_ref().clone(),
                job_service.get_ref().clone(),
            ));
            let schedule_aggr = Data::new(schedule::PipelineAggregator::new(
                schedule::ScheduleService::new(gitlab_client.clone(), gcd_config.clone()),
                project_service.get_ref().clone(),
                pipeline_service.get_ref().clone(),
                job_service.get_ref().clone(),
            ));

            test::init_service(App::new().configure(configure_app(
                api_config,
                Data::new(analytics::AnalyticsStore::default()),
                auth_state,
                qs_config,
                group_service,
                project_aggr,
                branch_aggr,
                schedule_aggr,
                job_service,
                pipeline_service,
                branch_service,
                artifact_service,
                runner_service,
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

        async fn runners(&self, _group_id: u64) -> Result<Vec<Runner>, ApiError> {
            Ok(vec![model::test::new_runner()])
        }

        async fn runner_details(&self, _runner_id: u64) -> Result<Runner, ApiError> {
            Ok(model::test::new_runner())
        }

        async fn runner_managers(&self, _runner_id: u64) -> Result<Vec<RunnerManager>, ApiError> {
            Ok(vec![RunnerManager {
                id: 1,
                ip_address: "192.0.2.10".to_string(),
                status: "online".to_string(),
                job_execution_status: "running".to_string(),
                contacted_at: None,
            }])
        }

        async fn runner_jobs(&self, _runner_id: u64) -> Result<Vec<RunnerJob>, ApiError> {
            Ok(vec![model::test::new_runner_job()])
        }

        async fn jobs(
            &self,
            _project_id: u64,
            _pipeline_id: u64,
            _scope: &[JobStatus],
        ) -> Result<Vec<Job>, ApiError> {
            Ok(vec![model::test::new_job()])
        }

        async fn bridges(
            &self,
            _project_id: u64,
            _pipeline_id: u64,
            _scope: &[JobStatus],
        ) -> Result<Vec<Bridge>, ApiError> {
            Ok(Vec::new())
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
    async fn test_runners_endpoint() {
        let app = setup_app!();
        let req = test::TestRequest::get()
            .uri("/api/runners?group_id=1")
            .to_request();
        let resp = test::call_service(&app, req).await;

        assert!(resp.status().is_success());
        let body = to_bytes(resp.into_body()).await.unwrap();
        let runners = serde_json::from_str::<Vec<RunnerWithJobs>>(to_str(&body)).unwrap();
        assert_eq!(runners.len(), 1);
        assert_eq!(runners[0].runner.id, 10);
        assert_eq!(runners[0].jobs[0].id, 20);
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
