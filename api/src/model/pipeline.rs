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
    pub status: String,
    pub source: String,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub web_url: String,
}

#[cfg(test)]
mod tests {
    use serde_json::json;

    use crate::model::{Pipeline, test};

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
        let expected = "{\"id\":1,\"iid\":2,\"project_id\":3,\"sha\":\"sha\",\"ref\":\"branch\",\"status\":\"status\",\"source\":\"source\",\"created_at\":\"1970-01-01T00:00:00Z\",\"updated_at\":\"1970-01-01T00:00:00Z\",\"web_url\":\"web_url\"}";
        assert_eq!(expected, json);
    }
}
