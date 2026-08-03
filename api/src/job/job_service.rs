use crate::config::config_app::AppConfig;
use crate::error::ApiError;
use crate::gitlab::GitlabApi;
use crate::model::{Job, JobStatus};
use moka::future::Cache;
use std::collections::{HashSet, VecDeque};
use std::sync::Arc;

#[derive(Debug, Clone, PartialEq, Eq, Hash)]
pub struct CacheKey {
    project_id: u64,
    pipeline_id: u64,
    scope: Vec<JobStatus>,
}

impl CacheKey {
    pub fn new(project_id: u64, pipeline_id: u64, scope: Vec<JobStatus>) -> Self {
        Self {
            project_id,
            pipeline_id,
            scope,
        }
    }
}

#[derive(Clone)]
pub struct JobService {
    cache: Cache<CacheKey, Vec<Job>>,
    client: Arc<dyn GitlabApi>,
}

impl JobService {
    pub fn new(client: Arc<dyn GitlabApi>, config: AppConfig) -> Self {
        let cache = Cache::builder().time_to_live(config.ttl_job_cache).build();

        Self { cache, client }
    }
}

impl JobService {
    pub async fn get_jobs(
        &self,
        project_id: u64,
        pipeline_id: u64,
        scope: &[JobStatus],
    ) -> Result<Vec<Job>, ApiError> {
        let key = CacheKey::new(project_id, pipeline_id, scope.to_vec());

        if let Some(jobs) = self.cache.get(&key).await {
            if !jobs.iter().any(|job| is_active(&job.status)) {
                return Ok(jobs);
            }

            // Active job trees must not remain stale for the full configured
            // cache TTL. The frontend only polls while an active job exists.
            self.cache.invalidate(&key).await;
        }

        self.cache
            .try_get_with(
                key,
                self.get_jobs_with_downstream_pipelines(project_id, pipeline_id, scope),
            )
            .await
            .map_err(|error| error.as_ref().to_owned())
    }

    async fn get_jobs_with_downstream_pipelines(
        &self,
        project_id: u64,
        pipeline_id: u64,
        scope: &[JobStatus],
    ) -> Result<Vec<Job>, ApiError> {
        let mut jobs = Vec::new();
        let mut pipelines = VecDeque::from([(project_id, pipeline_id)]);
        let mut visited = HashSet::new();

        while let Some((project_id, pipeline_id)) = pipelines.pop_front() {
            if !visited.insert((project_id, pipeline_id)) {
                continue;
            }

            jobs.extend(self.client.jobs(project_id, pipeline_id, scope).await?);

            for bridge in self.client.bridges(project_id, pipeline_id, scope).await? {
                jobs.push(bridge.job);
                if let Some(downstream) = bridge.downstream_pipeline {
                    pipelines.push_back((downstream.project_id, downstream.id));
                }
            }
        }

        jobs.sort_by(|a, b| {
            job_display_priority(a)
                .cmp(&job_display_priority(b))
                .then_with(|| a.created_at.cmp(&b.created_at))
                .then_with(|| a.id.cmp(&b.id))
        });
        Ok(jobs)
    }
}

fn job_display_priority(job: &Job) -> u8 {
    let stage = job.stage.to_ascii_lowercase();
    let name = job.name.to_ascii_lowercase();

    if stage.contains("cleanup")
        || stage.contains("clean-up")
        || stage.contains("teardown")
        || name.contains("cleanup")
        || name.contains("clean-up")
        || name.contains("teardown")
    {
        return 2;
    }

    if stage.contains("deploy") || name.contains("deploy") {
        return 1;
    }

    0
}

fn is_active(status: &JobStatus) -> bool {
    matches!(
        status,
        JobStatus::Created
            | JobStatus::Pending
            | JobStatus::Running
            | JobStatus::Canceling
            | JobStatus::WaitingForResource
    )
}
