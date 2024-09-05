use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct Pipeline {
    pub id: u64,
    pub iid: u64,
    pub project_id: u64,
    pub sha: String,
    #[serde(rename = "ref")]
    pub branch: String,
    pub status: PipelineStatus,
    pub source: PipelineSource,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub web_url: String,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum PipelineStatus {
    /// Currently running.
    Running,
    /// Ready to run, but no jobs have been claimed by a runner.
    Pending,
    /// Successfully completed.
    Success,
    /// Unsuccessfully completed.
    Failed,
    /// Canceled.
    Canceled,
    /// Canceling.
    Canceling,
    /// Skipped.
    Skipped,
    /// Created, but blocked on available runners or triggers.
    Created,
    /// Awaiting manual triggering.
    Manual,
    /// Pipelines which have been scheduled.
    Scheduled,
    /// Pipelines which are being prepared.
    Preparing,
    #[serde(rename = "waiting_for_resource")]
    /// Pipelines waiting for a resource.
    WaitingForResource,
}

#[derive(Clone, Debug, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum PipelineSource {
    /// A pipeline crated by pushing to a repository.
    Push,
    /// A pipeline created through the web interface.
    Web,
    /// A pipeline created by a trigger.
    Trigger,
    /// A pipeline created on a schedule.
    Schedule,
    /// A pipeline created through the API.
    Api,
    /// A pipeline created externally.
    External,
    /// A pipeline created by another pipeline.
    Pipeline,
    /// A pipeline created through a chat.
    Chat,
    #[serde(rename = "web_ide")]
    /// A pipeline created through the web IDE.
    WebIde,
    #[serde(rename = "merge_request_event")]
    /// A pipeline created by a merge request event.
    MergeRequestEvent,
    #[serde(rename = "external_pull_request_event")]
    /// A pipeline created by an external pull request event.
    ExternalPullRequestEvent,
    #[serde(rename = "parent_pipeline")]
    /// A pipeline created by a parent pipeline.
    ParentPipeline,
    #[serde(rename = "ondemand_dast_scan")]
    /// A pipeline created by an on-demand DAST scan.
    OnDemandDastScan,
    #[serde(rename = "ondemand_dast_validation")]
    /// A pipeline created by an on-demand DAST validation.
    OnDemandDastValidation,
    #[serde(rename = "security_orchestration_policy")]
    /// A pipeline created by a security orchestration policy.
    SecurityOrchestrationPolicy,
}

#[cfg(test)]
mod tests {
    use serde_json::json;

    use crate::model::{test, Pipeline, PipelineSource, PipelineStatus};

    #[test]
    fn pipeline_deserialize() {
        let value = json!({
            "id": 1314378511,
            "iid": 6,
            "project_id": 41558386,
            "sha": "6797a390bf73f89096af2e1dbade0a23a89e3a9e",
            "ref": "master",
            "status": "canceled",
            "source": "web",
            "created_at": "2024-06-01T10:44:53.114Z",
            "updated_at": "2024-06-01T10:45:16.894Z",
            "web_url": "web_url",
            "before_sha": "0000000000000000000000000000000000000000",
            "tag": false,
            "yaml_errors": null,
            "user": {
                "id": 13081321,
                "username": "gitlab.ci.dashboard",
                "name": "Gitlab CI Dashboard",
                "state": "active",
                "locked": false,
                "avatar_url": "avatar_url",
                "web_url": "web_url"
            },
            "started_at": "2024-06-01T10:44:53.962Z",
            "finished_at": "2024-06-01T10:45:16.881Z",
            "committed_at": null,
            "duration": 22,
            "queued_duration": null,
            "coverage": null,
            "detailed_status": {
                "icon": "status_canceled",
                "text": "Canceled",
                "label": "canceled",
                "group": "canceled",
                "tooltip": "canceled",
                "has_details": true,
                "details_path": "/go179/go-project-3/-/pipelines/1314378511",
                "illustration": null,
                "favicon": "/assets/ci_favicons/favicon_status_canceled-ca35321a6cda9943ebdf6631c8057ffd54064f3ba20cfe0ebc4b0b992041c430.png"
            },
            "name": null
        });

        let deserialized = serde_json::from_value::<Pipeline>(value).unwrap();
        assert_eq!(deserialized.id, 1314378511);
    }

    #[test]
    fn pipeline_serialize() {
        let value = test::new_pipeline();

        let json = serde_json::to_string(&value).unwrap();
        let expected = "{\"id\":1,\"iid\":2,\"project_id\":3,\"sha\":\"sha\",\"ref\":\"branch\",\"status\":\"running\",\"source\":\"web\",\"created_at\":\"1970-01-01T00:00:00Z\",\"updated_at\":\"1970-01-01T00:00:00Z\",\"web_url\":\"web_url\"}";
        assert_eq!(expected, json);
    }

    #[test]
    fn pipeline_status_serialize_deserialize() {
        let value = json!([
            "running",
            "pending",
            "success",
            "failed",
            "canceled",
            "canceling",
            "skipped",
            "created",
            "manual",
            "scheduled",
            "preparing",
            "waiting_for_resource"
        ]);

        let deserialized = serde_json::from_value::<Vec<PipelineStatus>>(value.clone()).unwrap();
        assert_eq!(deserialized.len(), 12);

        let serialized = serde_json::to_string(&deserialized).unwrap();
        assert_eq!(value.to_string(), serialized);
    }

    #[test]
    fn pipeline_source_serialize_deserialize() {
        let value = json!([
            "push",
            "web",
            "trigger",
            "schedule",
            "api",
            "external",
            "pipeline",
            "chat",
            "web_ide",
            "merge_request_event",
            "external_pull_request_event",
            "parent_pipeline",
            "ondemand_dast_scan",
            "ondemand_dast_validation",
            "security_orchestration_policy"
        ]);

        let deserialized = serde_json::from_value::<Vec<PipelineSource>>(value.clone()).unwrap();
        assert_eq!(deserialized.len(), 15);

        let serialized = serde_json::to_string(&deserialized).unwrap();
        assert_eq!(value.to_string(), serialized);
    }
}
