use serde::{Deserialize, Serialize};

use crate::model::Pipeline;

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct Project {
    pub id: u64,
    pub name: String,
    pub web_url: String,
    pub default_branch: String,
    pub topics: Vec<String>,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct ProjectPipeline {
    pub project: Project,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub pipeline: Option<Pipeline>,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct ProjectPipelines {
    pub project: Project,
    pub pipelines: Vec<Pipeline>,
}
