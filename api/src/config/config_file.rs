use serde::{Deserialize, Serialize};
use std::fs;

#[derive(Clone, Debug)]
pub enum Error { Read, Deserialize(String) }

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct FileConfig {
    pub server: Server,
    pub security: Security,
    pub authentication: Authentication,
    pub database: Database,
    pub analytics: Analytics,
    pub cache: Cache,
    pub pipeline: Pipeline,
    pub ui: Ui,
}

impl FileConfig {
    pub fn load_from_toml() -> Result<Self, Error> {
        let value = fs::read_to_string("config.toml").map_err(|_| Error::Read)?;
        toml::from_str(&value).map_err(|e| Error::Deserialize(format!("TOML error: {}", e.message())))
    }
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct Server { pub listen_ip: String, pub listen_port: u16, pub worker_count: usize }
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct Security { pub environment_token_encryption_key: String }
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct Authentication { pub username: String, pub password: String, pub secure_cookie: bool }
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct Database { pub url: String, pub max_connections: u32 }
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct Analytics { pub enabled: bool, pub sync_interval_seconds: u64, pub retention_days: i64 }
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct Cache {
    pub group_ttl_seconds: u64, pub project_ttl_seconds: u64, pub branch_ttl_seconds: u64,
    pub job_ttl_seconds: u64, pub pipeline_ttl_seconds: u64, pub schedule_ttl_seconds: u64,
    pub runner_ttl_seconds: u64, pub runner_detail_ttl_seconds: u64,
    pub runner_job_ttl_seconds: u64, pub artifact_ttl_seconds: u64,
}
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct Pipeline { pub history_days: i64 }
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct Ui {
    pub read_only: bool,
    pub hide_write_actions: bool, pub page_size_options: Vec<usize>, pub default_page_size: usize,
}
