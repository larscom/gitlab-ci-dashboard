use std::sync::Arc;
use std::time::Duration;

use actix_web::web;
use moka::future::Cache;
use serde::Deserialize;
use serde_querystring_actix::QueryString;
use web::{Data, Json};

use crate::config::Config;
use crate::error::ApiError;
use crate::gitlab::{GitlabApi, GitlabClient};
use crate::model::Job;

pub fn new_service(gitlab_client: &Arc<GitlabClient>, config: &Config) -> JobService {
    JobService::new(gitlab_client.clone(), new_cache(config.ttl_job_cache))
}

pub fn setup_jobs(cfg: &mut web::ServiceConfig) {
    cfg.route("/jobs", web::get().to(get_jobs));
}

#[derive(Deserialize)]
struct QueryParams {
    #[serde(rename = "projectId")]
    project_id: u64,
    #[serde(rename = "pipelineId")]
    pipeline_id: u64,
    scope: Vec<String>,
}

#[allow(private_interfaces)]
pub async fn get_jobs(
    QueryString(QueryParams {
        project_id,
        pipeline_id,
        scope,
    }): QueryString<QueryParams>,
    job_service: Data<JobService>,
) -> Result<Json<Vec<Job>>, ApiError> {
    let result = job_service
        .get_jobs(project_id, pipeline_id, &scope)
        .await?;
    Ok(Json(result))
}

pub struct JobService {
    cache: Cache<CacheKey, Vec<Job>>,
    client: Arc<dyn GitlabApi + Send + Sync>,
}

impl JobService {
    pub fn new(client: Arc<dyn GitlabApi + Send + Sync>, cache: Cache<CacheKey, Vec<Job>>) -> Self {
        Self { cache, client }
    }

    pub async fn get_jobs(
        &self,
        project_id: u64,
        pipeline_id: u64,
        scope: &[String],
    ) -> Result<Vec<Job>, ApiError> {
        self.cache
            .try_get_with(
                CacheKey::new(project_id, pipeline_id, scope.to_vec()),
                async {
                    self.client
                        .jobs(project_id, pipeline_id, scope)
                        .await
                        .map(|mut jobs| {
                            jobs.sort_unstable_by(|a, b| a.created_at.cmp(&b.created_at));
                            jobs
                        })
                },
            )
            .await
            .map_err(|error| error.as_ref().to_owned())
    }
}

#[derive(Debug, Clone, PartialEq, Eq, Hash)]
pub struct CacheKey {
    project_id: u64,
    pipeline_id: u64,
    scope: Vec<String>,
}

impl CacheKey {
    pub fn new(project_id: u64, pipeline_id: u64, scope: Vec<String>) -> Self {
        Self {
            project_id,
            pipeline_id,
            scope,
        }
    }
}

fn new_cache(ttl: Duration) -> Cache<CacheKey, Vec<Job>> {
    Cache::builder().time_to_live(ttl).build()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_cache_key() {
        assert_eq!(
            CacheKey::new(1, 2, vec![String::from("success")]),
            CacheKey::new(1, 2, vec![String::from("success")]),
        );

        assert_eq!(CacheKey::new(1, 2, vec![]), CacheKey::new(1, 2, vec![]));

        assert_ne!(CacheKey::new(1, 2, vec![]), CacheKey::new(2, 2, vec![]));
    }
}
