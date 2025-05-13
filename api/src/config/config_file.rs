use serde::{Deserialize, Serialize};
use std::fs;

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct FileConfig {
    pub gitlab: Gitlab,
    pub server: Server,
    pub cache: Cache,
    pub pipeline: Pipeline,
    pub project: Project,
    pub group: Group,
    pub ui: Ui,
}

impl FileConfig {
    pub fn load_from_toml() -> Result<Self, Box<dyn std::error::Error>> {
        let toml = fs::read_to_string("config.toml")?;
        Ok(toml::from_str(&toml)?)
    }
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct Gitlab {
    pub url: String,
    pub token: String,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct Server {
    pub ip: String,
    pub port: u16,
    pub workers: usize,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct Cache {
    pub ttl_group_seconds: u64,
    pub ttl_project_seconds: u64,
    pub ttl_branch_seconds: u64,
    pub ttl_job_seconds: u64,
    pub ttl_pipeline_seconds: u64,
    pub ttl_schedule_seconds: u64,
    pub ttl_artifact_seconds: u64,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct Pipeline {
    pub history_days: i64,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct Project {
    pub skip_ids: Vec<u64>,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct Group {
    pub only_ids: Vec<u64>,
    pub skip_ids: Vec<u64>,
    pub only_top_level: bool,
    pub include_subgroups: bool,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct Ui {
    pub read_only: bool,
    pub hide_write_actions: bool,
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
            server: Server {
                ip: "0.0.0.0".to_string(),
                port: 8080,
                workers: 4,
            },
            cache: Cache {
                ttl_group_seconds: 3600,
                ttl_project_seconds: 3600,
                ttl_branch_seconds: 3600,
                ttl_job_seconds: 3600,
                ttl_pipeline_seconds: 3600,
                ttl_schedule_seconds: 3600,
                ttl_artifact_seconds: 3600,
            },
            pipeline: Pipeline { history_days: 30 },
            project: Project {
                skip_ids: vec![123, 456, 789],
            },
            group: Group {
                only_ids: vec![1, 2, 3],
                skip_ids: vec![4, 5],
                only_top_level: true,
                include_subgroups: false,
            },
            ui: Ui {
                read_only: false,
                hide_write_actions: false,
            },
        };

        let toml = toml::to_string(&config).unwrap();
        println!("{}", toml);
    }
}
