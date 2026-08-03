use crate::error::ApiError;
use crate::gitlab::{GitlabApi, GitlabClient};
use crate::model::{Branch, Bridge, Group, Job, JobStatus, Pipeline, Project, Runner, RunnerJob, RunnerManager, Schedule};
use actix_web::web::Bytes;
use async_trait::async_trait;
use chrono::{DateTime, Utc};
use std::collections::HashMap;
use std::sync::{Arc, RwLock};

// Keep encoded IDs below JavaScript Number.MAX_SAFE_INTEGER.
const INSTANCE_SHIFT: u32 = 44;
const LOCAL_ID_MASK: u64 = (1_u64 << INSTANCE_SHIFT) - 1;

#[derive(Clone)]
struct Instance {
    index: usize,
    name: String,
    group_ids: Vec<u64>,
    client: Arc<GitlabClient>,
}

pub struct EnvironmentClientConfig {
    pub index: usize,
    pub name: String,
    pub url: String,
    pub token: String,
    pub group_ids: Vec<u64>,
}

pub struct FederatedGitlabClient { instances: RwLock<Vec<Instance>> }

impl FederatedGitlabClient {
    pub fn new(configs: Vec<EnvironmentClientConfig>) -> Self {
        let instances = configs.into_iter().map(|config| Instance {
            index: config.index, name: config.name, group_ids: config.group_ids,
            client: Arc::new(GitlabClient::new(&config.url, &config.token)),
        }).collect();
        Self { instances: RwLock::new(instances) }
    }

    pub fn replace(&self, configs: Vec<EnvironmentClientConfig>) {
        let instances = configs.into_iter().map(|config| Instance {
            index: config.index, name: config.name, group_ids: config.group_ids,
            client: Arc::new(GitlabClient::new(&config.url, &config.token)),
        }).collect();
        *self.instances.write().expect("GitLab environment registry lock") = instances;
    }

    fn encode(index: usize, id: u64) -> u64 {
        if index == 0 { id } else { ((index as u64) << INSTANCE_SHIFT) | (id & LOCAL_ID_MASK) }
    }

    fn decode(&self, id: u64) -> Result<(Instance, u64), ApiError> {
        let index = (id >> INSTANCE_SHIFT) as usize;
        self.instances.read().expect("GitLab environment registry lock").iter()
            .find(|item| item.index == index).cloned()
            .map(|instance| (instance, id & LOCAL_ID_MASK))
            .ok_or_else(|| ApiError::server_error(format!("Unknown GitLab environment namespace {index}")))
    }
    fn pipeline(index: usize, mut value: Pipeline) -> Pipeline {
        value.id = Self::encode(index, value.id);
        value.project_id = Self::encode(index, value.project_id);
        value
    }

    fn project(index: usize, mut value: Project) -> Project {
        value.id = Self::encode(index, value.id);
        value.namespace.id = Self::encode(index, value.namespace.id);
        value
    }

    fn job(index: usize, mut value: Job) -> Job {
        value.id = Self::encode(index, value.id);
        value.pipeline = Self::pipeline(index, value.pipeline);
        value
    }

    fn runner(index: usize, mut value: Runner) -> Runner {
        value.id = Self::encode(index, value.id);
        for project in &mut value.projects { project.id = Self::encode(index, project.id); }
        value
    }

    fn runner_job(index: usize, mut value: RunnerJob) -> RunnerJob {
        value.id = Self::encode(index, value.id);
        value.pipeline.id = Self::encode(index, value.pipeline.id);
        value.pipeline.project_id = Self::encode(index, value.pipeline.project_id);
        value
    }
}

#[async_trait]
impl GitlabApi for FederatedGitlabClient {
    async fn groups(&self, _skip: &[u64], top: bool) -> Result<Vec<Group>, ApiError> {
        let mut result = Vec::new();
        let instances = self.instances.read().expect("GitLab environment registry lock").clone();
        for instance in &instances {
            let mut groups = instance.client.groups(&[], top).await?;
            groups.retain(|group| instance.group_ids.is_empty() || instance.group_ids.contains(&group.id));
            for mut group in groups {
                group.id = Self::encode(instance.index, group.id);
                group.name = format!("{} / {}", instance.name, group.name);
                result.push(group);
            }
        }
        Ok(result)
    }

    async fn projects(&self, id: u64, subgroups: bool) -> Result<Vec<Project>, ApiError> {
        let (instance, local) = self.decode(id)?;
        Ok(instance.client.projects(local, subgroups).await?.into_iter().map(|v| Self::project(instance.index, v)).collect())
    }

    async fn latest_pipeline(&self, id: u64, branch: String) -> Result<Option<Pipeline>, ApiError> {
        let (instance, local) = self.decode(id)?;
        Ok(instance.client.latest_pipeline(local, branch).await?.map(|v| Self::pipeline(instance.index, v)))
    }

    async fn pipelines(&self, id: u64, after: Option<DateTime<Utc>>) -> Result<Vec<Pipeline>, ApiError> {
        let (instance, local) = self.decode(id)?;
        Ok(instance.client.pipelines(local, after).await?.into_iter().map(|v| Self::pipeline(instance.index, v)).collect())
    }

    async fn retry_pipeline(&self, project: u64, pipeline: u64) -> Result<Pipeline, ApiError> {
        let (instance, local_project) = self.decode(project)?;
        let (_, local_pipeline) = self.decode(pipeline)?;
        Ok(Self::pipeline(instance.index, instance.client.retry_pipeline(local_project, local_pipeline).await?))
    }

    async fn start_pipeline(&self, project: u64, branch: String, vars: Option<HashMap<String,String>>) -> Result<Pipeline, ApiError> {
        let (instance, local) = self.decode(project)?;
        Ok(Self::pipeline(instance.index, instance.client.start_pipeline(local, branch, vars).await?))
    }

    async fn cancel_pipeline(&self, project: u64, pipeline: u64) -> Result<Pipeline, ApiError> {
        let (instance, local_project) = self.decode(project)?;
        let (_, local_pipeline) = self.decode(pipeline)?;
        Ok(Self::pipeline(instance.index, instance.client.cancel_pipeline(local_project, local_pipeline).await?))
    }

    async fn branches(&self, project: u64) -> Result<Vec<Branch>, ApiError> {
        let (instance, local) = self.decode(project)?; instance.client.branches(local).await
    }

    async fn schedules(&self, project: u64) -> Result<Vec<Schedule>, ApiError> {
        let (instance, local) = self.decode(project)?;
        Ok(instance.client.schedules(local).await?.into_iter().map(|mut v| { v.id=Self::encode(instance.index,v.id); v }).collect())
    }

    async fn runners(&self, group: u64) -> Result<Vec<Runner>, ApiError> {
        let (instance, local) = self.decode(group)?;
        Ok(instance.client.runners(local).await?.into_iter().map(|v| Self::runner(instance.index,v)).collect())
    }

    async fn runner_details(&self, runner: u64) -> Result<Runner, ApiError> {
        let (instance, local) = self.decode(runner)?; Ok(Self::runner(instance.index, instance.client.runner_details(local).await?))
    }

    async fn runner_managers(&self, runner: u64) -> Result<Vec<RunnerManager>, ApiError> {
        let (instance, local) = self.decode(runner)?;
        Ok(instance.client.runner_managers(local).await?.into_iter().map(|mut v| { v.id=Self::encode(instance.index,v.id); v }).collect())
    }

    async fn runner_jobs(&self, runner: u64) -> Result<Vec<RunnerJob>, ApiError> {
        let (instance, local) = self.decode(runner)?;
        Ok(instance.client.runner_jobs(local).await?.into_iter().map(|v| Self::runner_job(instance.index,v)).collect())
    }

    async fn jobs(&self, project: u64, pipeline: u64, scope: &[JobStatus]) -> Result<Vec<Job>, ApiError> {
        let (instance, local_project) = self.decode(project)?; let (_, local_pipeline)=self.decode(pipeline)?;
        Ok(instance.client.jobs(local_project,local_pipeline,scope).await?.into_iter().map(|v| Self::job(instance.index,v)).collect())
    }

    async fn bridges(&self, project: u64, pipeline: u64, scope: &[JobStatus]) -> Result<Vec<Bridge>, ApiError> {
        let (instance, local_project)=self.decode(project)?; let (_,local_pipeline)=self.decode(pipeline)?;
        Ok(instance.client.bridges(local_project,local_pipeline,scope).await?.into_iter().map(|mut v| { v.job=Self::job(instance.index,v.job); if let Some(ref mut d)=v.downstream_pipeline { d.id=Self::encode(instance.index,d.id); d.project_id=Self::encode(instance.index,d.project_id); } v }).collect())
    }

    async fn artifact(&self, project: u64, job: u64) -> Result<Bytes, ApiError> {
        let (instance,local_project)=self.decode(project)?; let (_,local_job)=self.decode(job)?; instance.client.artifact(local_project,local_job).await
    }
}
