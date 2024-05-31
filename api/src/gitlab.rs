use async_trait::async_trait;
use chrono::{DateTime, Utc};
use reqwest::header::{HeaderMap, HeaderValue};
use reqwest::{Client, Url};
use serde::de::DeserializeOwned;
use tokio::sync::mpsc;

use crate::config::Config;
use crate::error::ApiError;
use crate::model::Pipeline;
use crate::model::Project;
use crate::model::Schedule;
use crate::model::{Branch, Group, Job};

pub fn new_client(config: &Config) -> GitlabClient {
    GitlabClient::new(config.gitlab_url.clone(), config.gitlab_token.clone())
}

#[async_trait]
pub trait GitlabApi {
    async fn groups(&self, skip_groups: &[u64], top_level: bool) -> Result<Vec<Group>, ApiError>;

    async fn projects(&self, group_id: u64) -> Result<Vec<Project>, ApiError>;

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

    async fn branches(&self, project_id: u64) -> Result<Vec<Branch>, ApiError>;

    async fn schedules(&self, project_id: u64) -> Result<Vec<Schedule>, ApiError>;

    async fn jobs(
        &self,
        project_id: u64,
        pipeline_id: u64,
        scope: &[String],
    ) -> Result<Vec<Job>, ApiError>;
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
    pub fn new(gitlab_url: String, gitlab_token: String) -> Self {
        let http_client = Client::builder()
            .default_headers(create_http_headers(&gitlab_token))
            .build()
            .expect("failed to build http client");
        Self {
            base_url: format!("{}/api/v4", gitlab_url),
            http_client,
        }
    }

    async fn do_get(
        &self,
        path: String,
        params: Vec<(String, String)>,
    ) -> Result<reqwest::Response, reqwest::Error> {
        let url = Url::parse_with_params(format!("{}{}", self.base_url, path).as_str(), params)
            .expect("failed to parse url with params");

        log::debug!("HTTP (get) {}", url);

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

        log::debug!("fetched page 1/{} data: {:?}", total_pages, all_data);

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
                log::debug!("fetching page {}", page);
                let result = self_clone.get_page(path, page, params).await;
                if let Err(err) = tx.send(result).await {
                    log::error!("could not send result via channel. err: {}", err);
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
            log::debug!("fetched page {}/{} data: {:?}", page, total_pages, data);
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

    async fn projects(&self, group_id: u64) -> Result<Vec<Project>, ApiError> {
        let params = [("archived".to_string(), "false".to_string())];
        let path = format!("/groups/{}/projects", group_id);
        self.get_all_pages(path.to_string(), params.to_vec()).await
    }

    async fn latest_pipeline(
        &self,
        project_id: u64,
        branch: String,
    ) -> Result<Option<Pipeline>, ApiError> {
        let params = [("ref".to_string(), branch)];
        let path = format!("/projects/{}/pipelines/latest", project_id);

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

        let path = format!("/projects/{}/pipelines", project_id);
        self.get_all_pages(path.to_string(), params.to_vec()).await
    }

    async fn branches(&self, project_id: u64) -> Result<Vec<Branch>, ApiError> {
        let params = [];
        let path = format!("/projects/{}/repository/branches", project_id);
        self.get_all_pages(path.to_string(), params.to_vec()).await
    }

    async fn schedules(&self, project_id: u64) -> Result<Vec<Schedule>, ApiError> {
        let params = [];
        let path = format!("/projects/{}/pipeline_schedules", project_id);
        self.get_all_pages(path.to_string(), params.to_vec()).await
    }

    async fn jobs(
        &self,
        project_id: u64,
        pipeline_id: u64,
        scope: &[String],
    ) -> Result<Vec<Job>, ApiError> {
        let mut params = vec![];
        for scope in scope {
            params.push(("scope[]".to_string(), scope.to_string()))
        }

        let path = format!("/projects/{}/pipelines/{}/jobs", project_id, pipeline_id);
        self.get_all_pages(path.to_string(), params).await
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
        HeaderValue::from_str(gitlab_token).expect("failed to create private token header"),
    );
    http_headers
}
