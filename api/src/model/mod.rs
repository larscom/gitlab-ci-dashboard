pub use branch::*;
pub use bridge::*;
pub use group::*;
pub use job::*;
pub use pipeline::*;
pub use project::*;
pub use runner::*;
pub use schedule::*;

pub mod pipeline;
pub mod project;
pub mod runner;

pub mod branch;
pub mod bridge;
pub mod commit;
pub mod group;
pub mod job;
pub mod schedule;
pub mod user;

#[cfg(test)]
pub mod test {
    use crate::model::commit::Commit;
    use crate::model::user::User;
    use crate::model::{
        Branch, Group, Job, JobStatus, Namespace, Pipeline, PipelineSource, PipelineStatus,
        Project, Runner, RunnerJob, RunnerJobPipeline, Schedule,
    };

    pub fn new_commit() -> Commit {
        Commit {
            id: "id".to_string(),
            author_name: "author_name".to_string(),
            committer_name: "committer_name".to_string(),
            committed_date: Default::default(),
            title: "title".to_string(),
            message: "message".to_string(),
        }
    }

    pub fn new_branch() -> Branch {
        Branch {
            name: "branch-1".to_string(),
            merged: false,
            protected: false,
            default: false,
            can_push: false,
            web_url: "web_url".to_string(),
            commit: new_commit(),
        }
    }

    pub fn new_pipeline() -> Pipeline {
        Pipeline {
            id: 1,
            iid: 2,
            project_id: 3,
            coverage: None,
            sha: "sha".to_string(),
            branch: "branch".to_string(),
            status: PipelineStatus::Running,
            source: PipelineSource::Web,
            created_at: Default::default(),
            updated_at: Default::default(),
            web_url: "web_url".to_string(),
        }
    }

    pub fn new_group() -> Group {
        Group {
            id: 1,
            name: "name".to_string(),
            full_path: "example/name".to_string(),
        }
    }

    pub fn new_job() -> Job {
        Job {
            id: 1,
            created_at: Default::default(),
            allow_failure: false,
            name: "name".to_string(),
            branch: "branch".to_string(),
            stage: "stage".to_string(),
            status: JobStatus::Success,
            web_url: "web_url".to_string(),
            pipeline: new_pipeline(),
            commit: new_commit(),
            user: new_user(),
        }
    }

    pub fn new_user() -> User {
        User {
            id: 123,
            username: "username".to_string(),
            name: "name".to_string(),
            state: "state".to_string(),
            is_admin: false,
        }
    }

    pub fn new_project() -> Project {
        Project {
            id: 456,
            jobs_enabled: true,
            name: "name".to_string(),
            path: None,
            web_url: "web_url".to_string(),
            default_branch: Some("default_branch".to_string()),
            topics: vec!["topic".to_string()],
            namespace: Namespace {
                id: 123,
                name: "namespace".to_string(),
                path: "namespace".to_string(),
                full_path: None,
            },
        }
    }

    pub fn new_schedule() -> Schedule {
        Schedule {
            id: 789,
            description: "description".to_string(),
            branch: "branch".to_string(),
            cron: "cron".to_string(),
            cron_timezone: "cron_timezone".to_string(),
            next_run_at: Default::default(),
            active: false,
            created_at: Default::default(),
            updated_at: Default::default(),
            owner: new_user(),
        }
    }

    pub fn new_runner() -> Runner {
        Runner {
            id: 10,
            description: "runner".to_string(),
            paused: false,
            is_shared: false,
            online: Some(true),
            runner_type: "group_type".to_string(),
            status: "online".to_string(),
            job_execution_status: "running".to_string(),
            tag_list: vec!["docker".to_string()],
            ip_address: "192.0.2.10".to_string(),
            projects: Vec::new(),
            scope_name: "example/group".to_string(),
            contacted_at: None,
        }
    }

    pub fn new_runner_job() -> RunnerJob {
        RunnerJob {
            id: 20,
            name: "build".to_string(),
            stage: "build".to_string(),
            status: "running".to_string(),
            branch: "main".to_string(),
            web_url: "web_url".to_string(),
            pipeline: RunnerJobPipeline {
                id: 30,
                project_id: 456,
                branch: "main".to_string(),
            },
            started_at: None,
            duration: Some(1.0),
        }
    }
}
