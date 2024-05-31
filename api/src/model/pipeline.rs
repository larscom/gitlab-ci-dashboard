use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct Pipeline {
    pub id: u64,
    pub iid: u64,
    pub project_id: u64,
    pub sha: String,
    #[serde(rename = "ref")]
    pub branch: String,
    pub status: String,
    pub source: String,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub web_url: String,
}
