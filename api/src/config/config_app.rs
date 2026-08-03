use crate::config::config_file::FileConfig;
use serde::{Deserialize, Serialize};
use std::time::Duration;

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct ApiConfig {
    pub api_version: String,
    pub read_only: bool,
    pub hide_write_actions: bool,
    pub page_size_options: Vec<usize>,
    pub default_page_size: usize,
    pub analytics_retention_days: i64,
    pub pipeline_history_days: i64,
}

impl ApiConfig {
    pub fn from_file(c: &FileConfig) -> Self {
        Self {
            api_version: option_env!("CARGO_PKG_VERSION").unwrap_or("dev").to_string(),
            read_only: c.ui.read_only, hide_write_actions: c.ui.hide_write_actions,
            page_size_options: c.ui.page_size_options.clone(), default_page_size: c.ui.default_page_size,
            analytics_retention_days: c.analytics.retention_days, pipeline_history_days: c.pipeline.history_days,
        }
    }
}

#[derive(Clone, Debug)]
pub struct AppConfig {
    pub server_ip: String, pub server_port: u16, pub server_workers: usize,
    pub ttl_group_cache: Duration, pub ttl_project_cache: Duration, pub ttl_branch_cache: Duration,
    pub ttl_job_cache: Duration, pub ttl_pipeline_cache: Duration, pub ttl_schedule_cache: Duration,
    pub ttl_runner_cache: Duration, pub ttl_runner_detail_cache: Duration,
    pub ttl_runner_job_cache: Duration, pub ttl_artifact_cache: Duration,
    pub pipeline_history_days: i64, pub project_skip_ids: Vec<u64>, pub group_only_ids: Vec<u64>,
    pub group_skip_ids: Vec<u64>, pub group_only_top_level: bool, pub group_include_subgroups: bool,
    pub analytics_enabled: bool, pub database_url: Option<String>, pub database_max_connections: u32,
    pub analytics_sync_interval: Duration, pub analytics_retention_days: i64,
}

impl AppConfig {
    pub fn from_file(c: &FileConfig) -> Self {
        Self {
            server_ip: c.server.listen_ip.clone(), server_port: c.server.listen_port,
            server_workers: c.server.worker_count,
            ttl_group_cache: Duration::from_secs(c.cache.group_ttl_seconds),
            ttl_project_cache: Duration::from_secs(c.cache.project_ttl_seconds),
            ttl_branch_cache: Duration::from_secs(c.cache.branch_ttl_seconds),
            ttl_job_cache: Duration::from_secs(c.cache.job_ttl_seconds),
            ttl_pipeline_cache: Duration::from_secs(c.cache.pipeline_ttl_seconds),
            ttl_schedule_cache: Duration::from_secs(c.cache.schedule_ttl_seconds),
            ttl_runner_cache: Duration::from_secs(c.cache.runner_ttl_seconds),
            ttl_runner_detail_cache: Duration::from_secs(c.cache.runner_detail_ttl_seconds),
            ttl_runner_job_cache: Duration::from_secs(c.cache.runner_job_ttl_seconds),
            ttl_artifact_cache: Duration::from_secs(c.cache.artifact_ttl_seconds),
            pipeline_history_days: c.pipeline.history_days,
            project_skip_ids: vec![], group_only_ids: vec![], group_skip_ids: vec![],
            group_only_top_level: true, group_include_subgroups: true,
            analytics_enabled: c.analytics.enabled,
            database_url: c.analytics.enabled.then(|| c.database.url.clone()),
            database_max_connections: c.database.max_connections,
            analytics_sync_interval: Duration::from_secs(c.analytics.sync_interval_seconds),
            analytics_retention_days: c.analytics.retention_days,
        }
    }
}
