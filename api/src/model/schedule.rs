use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};

use crate::model::user::User;
use crate::model::{Pipeline, Project};
use crate::util::deserialize::from_ref;

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct Schedule {
    pub id: u64,
    pub description: String,
    #[serde(rename = "ref", deserialize_with = "from_ref")]
    pub branch: String,
    pub cron: String,
    pub cron_timezone: String,
    pub next_run_at: DateTime<Utc>,
    pub active: bool,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub owner: User,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct ScheduleProjectPipeline {
    pub group_id: u64,
    pub schedule: Schedule,
    pub project: Project,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub pipeline: Option<Pipeline>,
}

#[cfg(test)]
mod tests {
    use serde_json::json;

    use crate::model::{test, Schedule, ScheduleProjectPipeline};

    #[test]
    fn schedule_deserialize() {
        let value = json!({
            "id": 369851,
            "description": "Schedule 1",
            "ref": "master",
            "cron": "0 12 * * *",
            "cron_timezone": "Europe/Amsterdam",
            "next_run_at": "2024-06-02T10:00:00.000Z",
            "active": true,
            "created_at": "2023-04-03T19:51:22.767Z",
            "updated_at": "2024-06-01T10:01:33.456Z",
            "owner": {
                "id": 13081321,
                "username": "gitlab.ci.dashboard",
                "name": "Gitlab CI Dashboard",
                "state": "active",
                "locked": false,
                "avatar_url": "avatar_url",
                "web_url": "web_url"
            }
        });

        let deserialized = serde_json::from_value::<Schedule>(value).unwrap();
        assert_eq!(deserialized.id, 369851);
    }

    #[test]
    fn schedule_serialize() {
        let value = test::new_schedule();

        let json = serde_json::to_string(&value).unwrap();
        let expected = "{\"id\":789,\"description\":\"description\",\"ref\":\"branch\",\"cron\":\"cron\",\"cron_timezone\":\"cron_timezone\",\"next_run_at\":\"1970-01-01T00:00:00Z\",\"active\":false,\"created_at\":\"1970-01-01T00:00:00Z\",\"updated_at\":\"1970-01-01T00:00:00Z\",\"owner\":{\"id\":123,\"username\":\"username\",\"name\":\"name\",\"state\":\"state\",\"is_admin\":false}}";
        assert_eq!(expected, json);
    }

    #[test]
    fn schedule_project_pipeline_serialize_none_pipeline() {
        let value = ScheduleProjectPipeline {
            group_id: 1,
            schedule: test::new_schedule(),
            project: test::new_project(),
            pipeline: None,
        };

        let json = serde_json::to_string(&value).unwrap();
        let expected = "{\"group_id\":1,\"schedule\":{\"id\":789,\"description\":\"description\",\"ref\":\"branch\",\"cron\":\"cron\",\"cron_timezone\":\"cron_timezone\",\"next_run_at\":\"1970-01-01T00:00:00Z\",\"active\":false,\"created_at\":\"1970-01-01T00:00:00Z\",\"updated_at\":\"1970-01-01T00:00:00Z\",\"owner\":{\"id\":123,\"username\":\"username\",\"name\":\"name\",\"state\":\"state\",\"is_admin\":false}},\"project\":{\"id\":456,\"name\":\"name\",\"web_url\":\"web_url\",\"default_branch\":\"default_branch\",\"topics\":[\"topic\"]}}";
        assert_eq!(expected, json);
    }

    #[test]
    fn schedule_project_pipeline_serialize_some_pipeline() {
        let value = ScheduleProjectPipeline {
            group_id: 1,
            schedule: test::new_schedule(),
            project: test::new_project(),
            pipeline: Some(test::new_pipeline()),
        };

        let json = serde_json::to_string(&value).unwrap();
        let expected = "{\"group_id\":1,\"schedule\":{\"id\":789,\"description\":\"description\",\"ref\":\"branch\",\"cron\":\"cron\",\"cron_timezone\":\"cron_timezone\",\"next_run_at\":\"1970-01-01T00:00:00Z\",\"active\":false,\"created_at\":\"1970-01-01T00:00:00Z\",\"updated_at\":\"1970-01-01T00:00:00Z\",\"owner\":{\"id\":123,\"username\":\"username\",\"name\":\"name\",\"state\":\"state\",\"is_admin\":false}},\"project\":{\"id\":456,\"name\":\"name\",\"web_url\":\"web_url\",\"default_branch\":\"default_branch\",\"topics\":[\"topic\"]},\"pipeline\":{\"id\":1,\"iid\":2,\"project_id\":3,\"sha\":\"sha\",\"ref\":\"branch\",\"status\":\"running\",\"source\":\"web\",\"created_at\":\"1970-01-01T00:00:00Z\",\"updated_at\":\"1970-01-01T00:00:00Z\",\"web_url\":\"web_url\"}}";
        assert_eq!(expected, json);
    }
}
