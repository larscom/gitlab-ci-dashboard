pub use branch::*;
pub use group::*;
pub use job::*;
pub use pipeline::*;
pub use project::*;
pub use schedule::*;

pub mod pipeline;
pub mod project;

pub mod branch;
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
        Project, Schedule,
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
            web_url: "web_url".to_string(),
            default_branch: Some("default_branch".to_string()),
            topics: vec!["topic".to_string()],
            namespace: Namespace {
                id: 123,
                name: "namespace".to_string(),
                path: "namespace".to_string(),
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
}
