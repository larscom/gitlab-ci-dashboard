use crate::model::Job;
use serde::{Deserialize, Serialize};

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct DownstreamPipeline {
    pub id: u64,
    pub project_id: u64,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct Bridge {
    #[serde(flatten)]
    pub job: Job,
    pub downstream_pipeline: Option<DownstreamPipeline>,
}
