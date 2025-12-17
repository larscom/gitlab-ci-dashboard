use crate::config::config_file;
use serde::{Deserialize, Serialize};
use std::{fmt::Display, num::NonZeroUsize, str::FromStr, thread, time::Duration};

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct ApiConfig {
    pub api_version: String,
    pub read_only: bool,
    pub hide_write_actions: bool,
    pub page_size_options: Vec<usize>,
    pub default_page_size: usize,
}

impl ApiConfig {
    pub fn new() -> Self {
        Self {
            api_version: from_env_or_default("VERSION", "dev".into()),
            read_only: from_env_or_default("API_READ_ONLY", true),
            hide_write_actions: from_env_or_default("UI_HIDE_WRITE_ACTIONS", false),
            page_size_options: split_into(from_env_or_default(
                "UI_PAGE_SIZE_OPTIONS",
                String::from("10,20,30,40,50"),
            )),
            default_page_size: from_env_or_default("UI_DEFAULT_PAGE_SIZE", 10),
        }
    }

    pub fn merge_with_file_config(self, file_config: &config_file::FileConfig) -> Self {
        Self {
            read_only: file_config
                .ui
                .as_ref()
                .and_then(|ui| ui.read_only)
                .unwrap_or(self.read_only),
            hide_write_actions: file_config
                .ui
                .as_ref()
                .and_then(|ui| ui.hide_write_actions)
                .unwrap_or(self.hide_write_actions),
            page_size_options: file_config
                .ui
                .as_ref()
                .and_then(|ui| ui.page_size_options.clone())
                .unwrap_or(self.page_size_options),
            default_page_size: file_config
                .ui
                .as_ref()
                .and_then(|ui| ui.default_page_size)
                .unwrap_or(self.default_page_size),
            ..self
        }
    }
}

#[derive(Clone, Debug)]
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

    pub fn merge_with_file_config(self, file_config: &config_file::FileConfig) -> Self {
        Self {
            gitlab_url: file_config.gitlab.url.clone(),
            gitlab_token: file_config.gitlab.token.clone(),
            server_ip: file_config
                .server
                .as_ref()
                .and_then(|s| s.ip.clone())
                .unwrap_or(self.server_ip),
            server_port: file_config
                .server
                .as_ref()
                .and_then(|s| s.port)
                .unwrap_or(self.server_port),
            server_workers: file_config
                .server
                .as_ref()
                .and_then(|s| s.workers)
                .unwrap_or(self.server_workers),
            ttl_group_cache: file_config
                .cache
                .as_ref()
                .and_then(|c| c.ttl_group_seconds)
                .map(Duration::from_secs)
                .unwrap_or(self.ttl_group_cache),
            ttl_project_cache: file_config
                .cache
                .as_ref()
                .and_then(|c| c.ttl_project_seconds)
                .map(Duration::from_secs)
                .unwrap_or(self.ttl_project_cache),
            ttl_branch_cache: file_config
                .cache
                .as_ref()
                .and_then(|c| c.ttl_branch_seconds)
                .map(Duration::from_secs)
                .unwrap_or(self.ttl_branch_cache),
            ttl_job_cache: file_config
                .cache
                .as_ref()
                .and_then(|c| c.ttl_job_seconds)
                .map(Duration::from_secs)
                .unwrap_or(self.ttl_job_cache),
            ttl_pipeline_cache: file_config
                .cache
                .as_ref()
                .and_then(|c| c.ttl_pipeline_seconds)
                .map(Duration::from_secs)
                .unwrap_or(self.ttl_pipeline_cache),
            ttl_schedule_cache: file_config
                .cache
                .as_ref()
                .and_then(|c| c.ttl_schedule_seconds)
                .map(Duration::from_secs)
                .unwrap_or(self.ttl_schedule_cache),
            ttl_artifact_cache: file_config
                .cache
                .as_ref()
                .and_then(|c| c.ttl_artifact_seconds)
                .map(Duration::from_secs)
                .unwrap_or(self.ttl_artifact_cache),
            pipeline_history_days: file_config
                .pipeline
                .as_ref()
                .and_then(|p| p.history_days)
                .unwrap_or(self.pipeline_history_days),
            project_skip_ids: file_config
                .project
                .as_ref()
                .and_then(|p| p.skip_ids.clone())
                .unwrap_or(self.project_skip_ids),
            group_only_ids: file_config
                .group
                .as_ref()
                .and_then(|g| g.only_ids.clone())
                .unwrap_or(self.group_only_ids),
            group_skip_ids: file_config
                .group
                .as_ref()
                .and_then(|g| g.skip_ids.clone())
                .unwrap_or(self.group_skip_ids),
            group_only_top_level: file_config
                .group
                .as_ref()
                .and_then(|g| g.only_top_level)
                .unwrap_or(self.group_only_top_level),
            group_include_subgroups: file_config
                .group
                .as_ref()
                .and_then(|g| g.include_subgroups)
                .unwrap_or(self.group_include_subgroups),
        }
    }
}

fn must_from_env(key: &str) -> String {
    std::env::var(key).unwrap_or_else(|_| panic!("{key} must be set!"))
}

fn from_env_or_default<T>(key: &str, default: T) -> T
where
    T: FromStr + Display,
{
    std::env::var(key)
        .ok()
        .and_then(|value| value.parse().ok())
        .unwrap_or(default)
}

fn split_into<T: FromStr>(value: impl Into<String>) -> Vec<T> {
    value
        .into()
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
