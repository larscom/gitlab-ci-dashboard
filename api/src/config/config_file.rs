use serde::{Deserialize, Serialize};
use std::fs;

#[derive(Clone, Debug)]
pub enum Error {
    Read,
    Deserialize(String),
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct FileConfig {
    pub gitlab: Gitlab,
    pub server: Option<Server>,
    pub cache: Option<Cache>,
    pub pipeline: Option<Pipeline>,
    pub project: Option<Project>,
    pub group: Option<Group>,
    pub ui: Option<Ui>,
}

impl FileConfig {
    pub fn load_from_toml() -> Result<Self, Error> {
        let toml = fs::read_to_string("config.toml").map_err(|_| Error::Read)?;
        toml::from_str(&toml)
            .map_err(|e| Error::Deserialize(format!("TOML error: {}", e.message())))
    }
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct Gitlab {
    pub url: String,
    pub token: String,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct Server {
    pub ip: Option<String>,
    pub port: Option<u16>,
    pub workers: Option<usize>,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct Cache {
    pub ttl_group_seconds: Option<u64>,
    pub ttl_project_seconds: Option<u64>,
    pub ttl_branch_seconds: Option<u64>,
    pub ttl_job_seconds: Option<u64>,
    pub ttl_pipeline_seconds: Option<u64>,
    pub ttl_schedule_seconds: Option<u64>,
    pub ttl_artifact_seconds: Option<u64>,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct Pipeline {
    pub history_days: Option<i64>,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct Project {
    pub skip_ids: Option<Vec<u64>>,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct Group {
    pub only_ids: Option<Vec<u64>>,
    pub skip_ids: Option<Vec<u64>>,
    pub only_top_level: Option<bool>,
    pub include_subgroups: Option<bool>,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct Ui {
    pub read_only: Option<bool>,
    pub hide_write_actions: Option<bool>,
    pub page_size_options: Option<Vec<usize>>,
    pub default_page_size: Option<usize>,
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_print_toml() {
        let config = FileConfig {
            gitlab: Gitlab {
                url: "https://gitlab.example.com".to_string(),
                token: "your-token-here".to_string(),
            },
            server: Some(Server {
                ip: Some("0.0.0.0".to_string()),
                port: Some(8080),
                workers: Some(4),
            }),
            cache: Some(Cache {
                ttl_group_seconds: Some(3600),
                ttl_project_seconds: Some(3600),
                ttl_branch_seconds: Some(3600),
                ttl_job_seconds: Some(3600),
                ttl_pipeline_seconds: Some(3600),
                ttl_schedule_seconds: Some(3600),
                ttl_artifact_seconds: Some(3600),
            }),
            pipeline: Some(Pipeline {
                history_days: Some(30),
            }),
            project: Some(Project {
                skip_ids: Some(vec![123, 456, 789]),
            }),
            group: Some(Group {
                only_ids: Some(vec![1, 2, 3]),
                skip_ids: Some(vec![4, 5]),
                only_top_level: Some(true),
                include_subgroups: Some(false),
            }),
            ui: Some(Ui {
                read_only: Some(false),
                hide_write_actions: Some(false),
                page_size_options: Some(vec![10, 20, 30, 40, 50]),
                default_page_size: Some(10),
            }),
        };

        let toml = toml::to_string(&config).unwrap();
        println!("{}", toml);
    }
}
