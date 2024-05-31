use serde::{Deserialize, Serialize};

use crate::model::commit::Commit;
use crate::model::Pipeline;

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct Branch {
    pub name: String,
    pub merged: bool,
    pub protected: bool,
    pub default: bool,
    pub can_push: bool,
    pub web_url: String,
    pub commit: Commit,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct BranchPipeline {
    pub branch: Branch,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub pipeline: Option<Pipeline>,
}
