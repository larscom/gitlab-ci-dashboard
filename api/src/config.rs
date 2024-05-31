use std::{fmt::Display, num::NonZeroUsize, str::FromStr, thread, time::Duration};

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

#[derive(Clone)]
pub struct Config {
    pub gitlab_url: String,
    pub gitlab_token: String,

    pub server_ip: String,
    pub server_port: u16,
    pub server_workers: usize,

    pub ttl_group_cache: Duration,
    pub ttl_project_cache: Duration,
    pub ttl_branch_cache: Duration,
    pub ttl_job_cache: Duration,
    pub ttl_latest_pipeline_cache: Duration,
    pub ttl_schedule_cache: Duration,

    pub pipeline_history_days: i64,

    pub project_skip_ids: Vec<u64>,

    pub group_only_ids: Vec<u64>,
    pub group_skip_ids: Vec<u64>,
    pub group_only_top_level: bool,
}

impl Config {
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
                10,
            )),
            ttl_latest_pipeline_cache: Duration::from_secs(from_env_or_default(
                "GITLAB_PIPELINE_CACHE_TTL_SECONDS",
                10,
            )),
            ttl_schedule_cache: Duration::from_secs(from_env_or_default(
                "GITLAB_SCHEDULE_CACHE_TTL_SECONDS",
                300,
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
            group_only_top_level: from_env_or_default("GITLAB_GROUP_ONLY_TOP_LEVEL", false),
        }
    }
}
