use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};

use crate::model::{Pipeline, Project};
use crate::model::user::User;

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct Schedule {
    pub id: u64,
    pub description: String,
    #[serde(rename = "ref")]
    pub branch: String,
    pub cron: String,
    pub cron_timezone: String,
    pub next_run_at: DateTime<Utc>,
    pub active: bool,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub owner: User,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct ScheduleProjectPipeline {
    pub schedule: Schedule,
    pub project: Project,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub pipeline: Option<Pipeline>,
}
