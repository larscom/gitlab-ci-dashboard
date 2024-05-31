use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct Commit {
    pub id: String,
    pub author_name: String,
    pub committer_name: String,
    pub committed_date: DateTime<Utc>,
    pub title: String,
    pub message: String,
}
