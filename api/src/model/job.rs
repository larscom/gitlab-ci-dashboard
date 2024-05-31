use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};

use crate::model::commit::Commit;
use crate::model::user::User;
use crate::model::Pipeline;

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct Job {
    pub id: u64,
    pub created_at: DateTime<Utc>,
    pub allow_failure: bool,
    pub name: String,
    #[serde(rename = "ref")]
    pub branch: String,
    pub stage: String,
    pub status: String,
    pub web_url: String,
    pub pipeline: Pipeline,
    pub commit: Commit,
    pub user: User,
}
