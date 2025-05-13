use crate::config::config_file;
use serde::{Deserialize, Serialize};
use std::{fmt::Display, num::NonZeroUsize, str::FromStr, thread, time::Duration};

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct ApiConfig {
    pub api_version: String,
    pub read_only: bool,
    pub hide_write_actions: bool,
}

impl ApiConfig {
    pub fn new() -> Self {
        Self {
            api_version: from_env_or_default("VERSION", "dev".into()),
            read_only: from_env_or_default("API_READ_ONLY", true),
            hide_write_actions: from_env_or_default("UI_HIDE_WRITE_ACTIONS", false),
        }
    }

    pub fn load() -> Self {
        match config_file::load() {
            Ok(config) => config.into(),
            Err(_) => Self::new(),
        }
    }
}

impl From<config_file::Config> for ApiConfig {
    fn from(config: config_file::Config) -> Self {
        Self {
            api_version: from_env_or_default("VERSION", "dev".into()),
            read_only: config.ui.read_only,
            hide_write_actions: config.ui.hide_write_actions,
        }
    }
}

#[derive(Clone)]
pub struct AppConfig {
    pub gitlab_url: String,
    pub gitlab_token: String,

    pub server_ip: String,
    pub server_port: u16,
    pub server_workers: usize,

    pub ttl_group_cache: Duration,
    pub ttl_project_cache: Duration,
    pub ttl_branch_cache: Duration,
    pub ttl_job_cache: Duration,
    pub ttl_pipeline_cache: Duration,
    pub ttl_schedule_cache: Duration,
    pub ttl_artifact_cache: Duration,

    pub pipeline_history_days: i64,

    pub project_skip_ids: Vec<u64>,

    pub group_only_ids: Vec<u64>,
    pub group_skip_ids: Vec<u64>,
    pub group_only_top_level: bool,
    pub group_include_subgroups: bool,
}

impl From<config_file::Config> for AppConfig {
    fn from(config: config_file::Config) -> Self {
        Self {
            gitlab_url: config.gitlab.url,
            gitlab_token: config.gitlab.token,
            server_ip: config.server.ip,
            server_port: config.server.port,
            server_workers: config.server.workers,
            ttl_group_cache: Duration::from_secs(config.cache.ttl_group_seconds),
            ttl_project_cache: Duration::from_secs(config.cache.ttl_project_seconds),
            ttl_branch_cache: Duration::from_secs(config.cache.ttl_branch_seconds),
            ttl_job_cache: Duration::from_secs(config.cache.ttl_job_seconds),
            ttl_pipeline_cache: Duration::from_secs(config.cache.ttl_pipeline_seconds),
            ttl_schedule_cache: Duration::from_secs(config.cache.ttl_schedule_seconds),
            ttl_artifact_cache: Duration::from_secs(config.cache.ttl_artifact_seconds),
            pipeline_history_days: config.pipeline.history_days,
            project_skip_ids: config.project.skip_ids,
            group_only_ids: config.group.only_ids,
            group_skip_ids: config.group.skip_ids,
            group_only_top_level: config.group.only_top_level,
            group_include_subgroups: config.group.include_subgroups,
        }
    }
}

impl AppConfig {
    pub fn new() -> Self {
        Self {
            gitlab_url: must_from_env("GITLAB_BASE_URL"),
            gitlab_token: must_from_env("GITLAB_API_TOKEN"),
            server_ip: from_env_or_default("SERVER_LISTEN_IP", "0.0.0.0".into()),
            server_port: from_env_or_default("SERVER_LISTEN_PORT", 8080),
            server_workers: from_env_or_default(
                "SERVER_WORKER_COUNT",
                thread::available_parallelism().map_or(2, NonZeroUsize::get),
            ),
            ttl_group_cache: Duration::from_secs(from_env_or_default(
                "GITLAB_GROUP_CACHE_TTL_SECONDS",
                300,
            )),
            ttl_project_cache: Duration::from_secs(from_env_or_default(
                "GITLAB_PROJECT_CACHE_TTL_SECONDS",
                300,
            )),
            ttl_branch_cache: Duration::from_secs(from_env_or_default(
                "GITLAB_BRANCH_CACHE_TTL_SECONDS",
                60,
            )),
            ttl_job_cache: Duration::from_secs(from_env_or_default(
                "GITLAB_JOB_CACHE_TTL_SECONDS",
                5,
            )),
            ttl_pipeline_cache: Duration::from_secs(from_env_or_default(
                "GITLAB_PIPELINE_CACHE_TTL_SECONDS",
                5,
            )),
            ttl_schedule_cache: Duration::from_secs(from_env_or_default(
                "GITLAB_SCHEDULE_CACHE_TTL_SECONDS",
                300,
            )),
            ttl_artifact_cache: Duration::from_secs(from_env_or_default(
                "GITLAB_ARTIFACT_CACHE_TTL_SECONDS",
                1800,
            )),
            pipeline_history_days: from_env_or_default("GITLAB_PIPELINE_HISTORY_DAYS", 5),
            project_skip_ids: split_into(from_env_or_default(
                "GITLAB_PROJECT_SKIP_IDS",
                String::default(),
            )),
            group_only_ids: split_into(from_env_or_default(
                "GITLAB_GROUP_ONLY_IDS",
                String::default(),
            )),
            group_skip_ids: split_into(from_env_or_default(
                "GITLAB_GROUP_SKIP_IDS",
                String::default(),
            )),
            group_only_top_level: from_env_or_default("GITLAB_GROUP_ONLY_TOP_LEVEL", true),
            group_include_subgroups: from_env_or_default("GITLAB_GROUP_INCLUDE_SUBGROUPS", true),
        }
    }

    pub fn load() -> Self {
        match config_file::load() {
            Ok(config) => config.into(),
            Err(_) => Self::new(),
        }
    }
}

fn must_from_env(key: &str) -> String {
    let value = std::env::var(key).unwrap_or_else(|_| panic!("{} must be set!", key));
    log::debug!("{key}={value}");
    value
}

fn from_env_or_default<T>(key: &str, default: T) -> T
where
    T: FromStr + Display,
{
    let value = std::env::var(key)
        .ok()
        .and_then(|value| value.parse().ok())
        .unwrap_or(default);
    log::debug!("{key}={value}");
    value
}

fn split_into<T: FromStr>(value: String) -> Vec<T> {
    value
        .split(',')
        .filter_map(|v| v.parse::<T>().ok())
        .collect()
}

#[cfg(test)]
mod tests {
    use std::collections::HashMap;
    use std::env;

    use serial_test::serial;

    use super::*;

    #[test]
    #[serial]
    fn config_new() {
        clear_env_vars();
        set_env_vars();

        let config = AppConfig::new();

        assert_eq!(config.gitlab_url, "https://gitlab.url");
        assert_eq!(config.gitlab_token, "token123");
        assert_eq!(config.server_ip, "127.0.0.1");
        assert_eq!(config.server_port, 9090);
        assert_eq!(config.server_workers, 4);
        assert_eq!(config.ttl_group_cache, Duration::from_secs(600));
        assert_eq!(config.ttl_project_cache, Duration::from_secs(600));
        assert_eq!(config.ttl_branch_cache, Duration::from_secs(120));
        assert_eq!(config.ttl_job_cache, Duration::from_secs(20));
        assert_eq!(config.ttl_pipeline_cache, Duration::from_secs(20));
        assert_eq!(config.ttl_schedule_cache, Duration::from_secs(600));
        assert_eq!(config.pipeline_history_days, 10);
        assert_eq!(config.project_skip_ids, vec![1, 2, 3]);
        assert_eq!(config.group_only_ids, vec![4, 5, 6]);
        assert_eq!(config.group_skip_ids, vec![7, 8, 9]);
        assert!(!config.group_only_top_level);
        assert!(!config.group_include_subgroups);
    }

    #[test]
    #[serial]
    fn config_new_with_defaults() {
        clear_env_vars();

        env::set_var("GITLAB_BASE_URL", "https://gitlab.url");
        env::set_var("GITLAB_API_TOKEN", "token123");

        let config = AppConfig::new();

        assert_eq!(config.gitlab_url, "https://gitlab.url");
        assert_eq!(config.gitlab_token, "token123");
        assert_eq!(config.server_ip, "0.0.0.0");
        assert_eq!(config.server_port, 8080);
        assert!(config.server_workers > 0);
        assert_eq!(config.ttl_group_cache, Duration::from_secs(300));
        assert_eq!(config.ttl_project_cache, Duration::from_secs(300));
        assert_eq!(config.ttl_branch_cache, Duration::from_secs(60));
        assert_eq!(config.ttl_job_cache, Duration::from_secs(5));
        assert_eq!(config.ttl_pipeline_cache, Duration::from_secs(5));
        assert_eq!(config.ttl_schedule_cache, Duration::from_secs(300));
        assert_eq!(config.pipeline_history_days, 5);
        assert!(config.project_skip_ids.is_empty());
        assert!(config.group_only_ids.is_empty());
        assert!(config.group_skip_ids.is_empty());
        assert!(config.group_only_top_level);
        assert!(config.group_include_subgroups);
    }

    #[test]
    #[serial]
    #[should_panic(expected = "GITLAB_BASE_URL must be set!")]
    fn must_from_env_missing() {
        clear_env_vars();
        must_from_env("GITLAB_BASE_URL");
    }

    #[test]
    #[serial]
    fn test_from_env_or_default() {
        clear_env_vars();

        env::set_var("TEST_VAR", "42");
        assert_eq!(from_env_or_default("TEST_VAR", 0), 42);
        env::remove_var("TEST_VAR");
        assert_eq!(from_env_or_default("TEST_VAR", 0), 0);
    }

    #[test]
    fn test_split_into() {
        let input = "1,2,3".to_string();
        let result: Vec<u64> = split_into(input);
        assert_eq!(result, vec![1, 2, 3]);
    }

    fn clear_env_vars() {
        let vars = env::vars().collect::<HashMap<String, String>>();

        for key in vars.keys() {
            env::remove_var(key);
        }

        assert!(env::vars().next().is_none())
    }

    fn set_env_vars() {
        env::set_var("GITLAB_BASE_URL", "https://gitlab.url");
        env::set_var("GITLAB_API_TOKEN", "token123");
        env::set_var("GITLAB_READONLY_MODE", "false");
        env::set_var("SERVER_LISTEN_IP", "127.0.0.1");
        env::set_var("SERVER_LISTEN_PORT", "9090");
        env::set_var("SERVER_WORKER_COUNT", "4");
        env::set_var("GITLAB_GROUP_CACHE_TTL_SECONDS", "600");
        env::set_var("GITLAB_PROJECT_CACHE_TTL_SECONDS", "600");
        env::set_var("GITLAB_BRANCH_CACHE_TTL_SECONDS", "120");
        env::set_var("GITLAB_JOB_CACHE_TTL_SECONDS", "20");
        env::set_var("GITLAB_PIPELINE_CACHE_TTL_SECONDS", "20");
        env::set_var("GITLAB_SCHEDULE_CACHE_TTL_SECONDS", "600");
        env::set_var("GITLAB_PIPELINE_HISTORY_DAYS", "10");
        env::set_var("GITLAB_PROJECT_SKIP_IDS", "1,2,3");
        env::set_var("GITLAB_GROUP_ONLY_IDS", "4,5,6");
        env::set_var("GITLAB_GROUP_SKIP_IDS", "7,8,9");
        env::set_var("GITLAB_GROUP_ONLY_TOP_LEVEL", "false");
        env::set_var("GITLAB_GROUP_INCLUDE_SUBGROUPS", "false");
    }
}
