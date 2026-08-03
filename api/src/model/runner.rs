use chrono::{DateTime, Utc};
use serde::{Deserialize, Deserializer, Serialize};

#[derive(Clone, Debug, Default, Serialize, Deserialize)]
pub struct RunnerProject {
    pub id: u64,
    #[serde(default, deserialize_with = "nullable_string")]
    pub name: String,
    #[serde(default, deserialize_with = "nullable_string")]
    pub path_with_namespace: String,
}

#[derive(Clone, Debug, Default, Serialize, Deserialize)]
pub struct RunnerManager {
    pub id: u64,
    #[serde(default, deserialize_with = "nullable_string")]
    pub ip_address: String,
    #[serde(default, deserialize_with = "nullable_string")]
    pub status: String,
    #[serde(default, deserialize_with = "nullable_string")]
    pub job_execution_status: String,
    pub contacted_at: Option<DateTime<Utc>>,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct Runner {
    pub id: u64,
    #[serde(default, deserialize_with = "nullable_string")]
    pub description: String,
    #[serde(default)]
    pub paused: bool,
    #[serde(default)]
    pub is_shared: bool,
    pub online: Option<bool>,
    #[serde(default, deserialize_with = "nullable_string")]
    pub runner_type: String,
    #[serde(default, deserialize_with = "nullable_string")]
    pub status: String,
    #[serde(default, deserialize_with = "nullable_string")]
    pub job_execution_status: String,
    #[serde(default)]
    pub tag_list: Vec<String>,
    #[serde(default, deserialize_with = "nullable_string")]
    pub ip_address: String,
    #[serde(default)]
    pub projects: Vec<RunnerProject>,
    #[serde(default)]
    pub scope_name: String,
    pub contacted_at: Option<DateTime<Utc>>,
}

fn nullable_string<'de, D>(deserializer: D) -> Result<String, D::Error>
where
    D: Deserializer<'de>,
{
    Ok(Option::<String>::deserialize(deserializer)?.unwrap_or_default())
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct RunnerJobPipeline {
    pub id: u64,
    pub project_id: u64,
    #[serde(rename = "ref", default)]
    pub branch: String,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct RunnerJob {
    pub id: u64,
    #[serde(default)]
    pub name: String,
    #[serde(default)]
    pub stage: String,
    #[serde(default, deserialize_with = "nullable_string")]
    pub status: String,
    #[serde(rename = "ref", default)]
    pub branch: String,
    #[serde(default)]
    pub web_url: String,
    pub pipeline: RunnerJobPipeline,
    pub started_at: Option<DateTime<Utc>>,
    pub duration: Option<f64>,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct RunnerWithJobs {
    pub group_id: u64,
    pub runner: Runner,
    pub jobs: Vec<RunnerJob>,
}
