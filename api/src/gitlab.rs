use crate::error::ApiError;
use crate::model::Project;
use crate::model::Schedule;
use crate::model::{Branch, Group, Job};
use crate::model::{JobStatus, Pipeline};
use actix_web::web::Bytes;
use async_trait::async_trait;
use chrono::{DateTime, Utc};
use reqwest::header::{HeaderMap, HeaderValue};
use reqwest::{Client, Url};
use serde::de::DeserializeOwned;
use serde_json::Value;
use std::collections::HashMap;
use tokio::sync::mpsc;

#[async_trait]
pub trait GitlabApi: Send + Sync {
    async fn groups(&self, skip_groups: &[u64], top_level: bool) -> Result<Vec<Group>, ApiError>;

    async fn projects(
        &self,
        group_id: u64,
        include_subgroups: bool,
    ) -> Result<Vec<Project>, ApiError>;

    async fn latest_pipeline(
        &self,
        project_id: u64,
        branch: String,
    ) -> Result<Option<Pipeline>, ApiError>;

    async fn pipelines(
        &self,
        project_id: u64,
        updated_after: Option<DateTime<Utc>>,
    ) -> Result<Vec<Pipeline>, ApiError>;

    async fn retry_pipeline(&self, project_id: u64, pipeline_id: u64)
        -> Result<Pipeline, ApiError>;

    async fn start_pipeline(
        &self,
        project_id: u64,
        branch: String,
        env_vars: Option<HashMap<String, String>>,
    ) -> Result<Pipeline, ApiError>;

    async fn cancel_pipeline(
        &self,
        project_id: u64,
        pipeline_id: u64,
    ) -> Result<Pipeline, ApiError>;

    async fn branches(&self, project_id: u64) -> Result<Vec<Branch>, ApiError>;

    async fn schedules(&self, project_id: u64) -> Result<Vec<Schedule>, ApiError>;

    async fn jobs(
        &self,
        project_id: u64,
        pipeline_id: u64,
        scope: &[JobStatus],
    ) -> Result<Vec<Job>, ApiError>;

    async fn artifact(&self, project_id: u64, job_id: u64) -> Result<Bytes, ApiError>;
}

#[derive(Clone)]
pub struct GitlabClient {
    base_url: String,
    http_client: Client,
}

#[derive(Debug)]
struct Page<T: DeserializeOwned> {
    data: T,
    page: usize,
    total_pages: usize,
}

impl GitlabClient {
    pub fn new(gitlab_url: &str, gitlab_token: &str) -> Self {
        let http_client = Client::builder()
            .default_headers(create_http_headers(gitlab_token))
            .build()
            .expect("http client to be build");
        Self {
            base_url: format!("{gitlab_url}/api/v4"),
            http_client,
        }
    }
}

impl GitlabClient {
    async fn do_post(
        &self,
        path: String,
        params: Vec<(String, String)>,
        body_json: Option<Value>,
    ) -> Result<reqwest::Response, reqwest::Error> {
        let url = Url::parse_with_params(format!("{}{}", self.base_url, path).as_str(), params)
            .expect("url to be parsed with params");

        log::debug!("HTTP (post) {url} body: {body_json:?}");
        let builder = self.http_client.post(url);

        match body_json {
            Some(body) => builder.json(&body).send().await?.error_for_status(),
            None => builder.send().await?.error_for_status(),
        }
    }

    async fn do_post_parsed<T: DeserializeOwned>(
        &self,
        path: String,
        params: Vec<(String, String)>,
        body_json: Option<Value>,
    ) -> Result<T, reqwest::Error> {
        self.do_post(path, params, body_json).await?.json().await
    }

    async fn do_get(
        &self,
        path: String,
        params: Vec<(String, String)>,
    ) -> Result<reqwest::Response, reqwest::Error> {
        let url = Url::parse_with_params(format!("{}{}", self.base_url, path).as_str(), params)
            .expect("url to be parsed with params");

        log::debug!("HTTP (get) {url}");

        self.http_client.get(url).send().await?.error_for_status()
    }

    async fn do_get_parsed<T: DeserializeOwned>(
        &self,
        path: String,
        params: Vec<(String, String)>,
    ) -> Result<T, reqwest::Error> {
        self.do_get(path, params).await?.json().await
    }

    async fn get_page<T: DeserializeOwned>(
        &self,
        path: String,
        page: usize,
        params: Vec<(String, String)>,
    ) -> Result<Page<T>, reqwest::Error> {
        let mut params = params;
        params.push(("page".to_string(), page.to_string()));
        params.push(("per_page".to_string(), "100".to_string()));

        let response = self.do_get(path, params).await?;
        let total_pages = get_total_pages(response.headers());
        let data = response.json().await?;

        Ok(Page {
            data,
            page,
            total_pages,
        })
    }

    async fn get_all_pages<T>(
        &self,
        path: String,
        params: Vec<(String, String)>,
    ) -> Result<Vec<T>, ApiError>
    where
        T: DeserializeOwned + Send + 'static,
        T: std::fmt::Debug,
    {
        log::debug!("fetching page 1");

        let Page {
            data: mut all_data,
            total_pages,
            page: _,
        } = self.get_page(path.clone(), 1, params.clone()).await?;

        log::debug!("fetched page 1/{total_pages} data: {all_data:?}");

        if total_pages == 1 {
            return Ok(all_data);
        }

        let (tx, mut rx) = mpsc::channel(total_pages);

        for page in 2..total_pages + 1 {
            let self_clone = self.clone();
            let params = params.clone();
            let path = path.clone();
            let tx = tx.clone();
            tokio::spawn(async move {
                log::debug!("fetching page {page}");
                let result = self_clone.get_page(path, page, params).await;
                if let Err(err) = tx.send(result).await {
                    log::error!("could not send result via channel. err: {err}");
                }
            });
        }

        drop(tx);

        while let Some(result) = rx.recv().await {
            let Page {
                mut data,
                total_pages,
                page,
            } = result?;
            log::debug!("fetched page {page}/{total_pages} data: {data:?}");
            all_data.append(&mut data);
        }

        Ok(all_data)
    }
}

#[async_trait]
impl GitlabApi for GitlabClient {
    async fn groups(&self, skip_groups: &[u64], top_level: bool) -> Result<Vec<Group>, ApiError> {
        let mut params = vec![("top_level_only".to_string(), top_level.to_string())];
        if !skip_groups.is_empty() {
            params.push((
                "skip_groups".to_string(),
                skip_groups
                    .iter()
                    .map(|g| g.to_string())
                    .collect::<Vec<_>>()
                    .join(","),
            ))
        }

        let path = "/groups";
        self.get_all_pages(path.to_string(), params).await
    }

    async fn projects(
        &self,
        group_id: u64,
        include_subgroups: bool,
    ) -> Result<Vec<Project>, ApiError> {
        let params = [
            ("archived".to_string(), "false".to_string()),
            (
                "include_subgroups".to_string(),
                include_subgroups.to_string(),
            ),
        ];
        let path = format!("/groups/{group_id}/projects");

        self.get_all_pages(path, params.to_vec()).await
    }

    async fn latest_pipeline(
        &self,
        project_id: u64,
        branch: String,
    ) -> Result<Option<Pipeline>, ApiError> {
        let params = [("ref".to_string(), branch)];
        let path = format!("/projects/{project_id}/pipelines/latest");

        match self.do_get_parsed::<Pipeline>(path, params.to_vec()).await {
            Ok(pipeline) => Ok(Some(pipeline)),
            Err(error) => {
                let status = error.status();
                status.map_or_else(
                    || Ok(None),
                    |code| {
                        if code == reqwest::StatusCode::FORBIDDEN {
                            Ok(None)
                        } else {
                            Err(error.into())
                        }
                    },
                )
            }
        }
    }

    async fn pipelines(
        &self,
        project_id: u64,
        updated_after: Option<DateTime<Utc>>,
    ) -> Result<Vec<Pipeline>, ApiError> {
        let params = updated_after
            .map(|d| [("updated_after".to_string(), d.to_string())])
            .unwrap_or_default();

        let path = format!("/projects/{project_id}/pipelines");
        self.get_all_pages(path, params.to_vec()).await
    }

    async fn retry_pipeline(
        &self,
        project_id: u64,
        pipeline_id: u64,
    ) -> Result<Pipeline, ApiError> {
        let params = [];
        let path = format!("/projects/{project_id}/pipelines/{pipeline_id}/retry");

        self.do_post_parsed(path, params.to_vec(), None)
            .await
            .map_err(|e| e.into())
    }

    async fn start_pipeline(
        &self,
        project_id: u64,
        branch: String,
        env_vars: Option<HashMap<String, String>>,
    ) -> Result<Pipeline, ApiError> {
        let params = [("ref".to_string(), branch)];
        let path = format!("/projects/{project_id}/pipeline");

        let body_json = env_vars.map(|vars| {
            let mut env_vars = Vec::new();
            for (key, value) in vars {
                let mut o = serde_json::Map::new();
                o.insert("key".to_string(), Value::String(key));
                o.insert("value".to_string(), Value::String(value));
                env_vars.push(Value::Object(o));
            }

            let mut o = serde_json::Map::new();
            o.insert("variables".to_string(), Value::Array(env_vars));

            Value::Object(o)
        });

        self.do_post_parsed(path, params.to_vec(), body_json)
            .await
            .map_err(|e| e.into())
    }

    async fn cancel_pipeline(
        &self,
        project_id: u64,
        pipeline_id: u64,
    ) -> Result<Pipeline, ApiError> {
        let params = [];
        let path = format!("/projects/{project_id}/pipelines/{pipeline_id}/cancel");

        self.do_post_parsed(path, params.to_vec(), None)
            .await
            .map_err(|e| e.into())
    }

    async fn branches(&self, project_id: u64) -> Result<Vec<Branch>, ApiError> {
        let params = [];
        let path = format!("/projects/{project_id}/repository/branches");
        self.get_all_pages(path, params.to_vec()).await
    }

    async fn schedules(&self, project_id: u64) -> Result<Vec<Schedule>, ApiError> {
        let params = [];
        let path = format!("/projects/{project_id}/pipeline_schedules");
        self.get_all_pages(path, params.to_vec()).await
    }

    async fn jobs(
        &self,
        project_id: u64,
        pipeline_id: u64,
        scope: &[JobStatus],
    ) -> Result<Vec<Job>, ApiError> {
        let mut params = vec![];
        for scope in scope {
            params.push(("scope[]".to_string(), scope.as_string()))
        }

        let path = format!("/projects/{project_id}/pipelines/{pipeline_id}/jobs");
        self.get_all_pages(path, params).await
    }

    async fn artifact(&self, project_id: u64, job_id: u64) -> Result<Bytes, ApiError> {
        let params = [];
        let path = format!("/projects/{project_id}/jobs/{job_id}/artifacts");
        Ok(self.do_get(path, params.to_vec()).await?.bytes().await?)
    }
}

fn get_total_pages(headers: &HeaderMap) -> usize {
    headers
        .get("x-total-pages")
        .and_then(|value| value.to_str().ok())
        .filter(|s| !s.is_empty())
        .and_then(|s| s.parse::<usize>().ok())
        .unwrap_or(1)
}

fn create_http_headers(gitlab_token: &str) -> HeaderMap {
    let mut http_headers = HeaderMap::new();
    http_headers.append("Content-Type", HeaderValue::from_static("application/json"));
    http_headers.append(
        "PRIVATE-TOKEN",
        HeaderValue::from_str(gitlab_token).expect("private token header to be set"),
    );
    http_headers
}
