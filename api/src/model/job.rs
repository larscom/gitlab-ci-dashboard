use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};

use crate::model::commit::Commit;
use crate::model::Pipeline;
use crate::model::user::User;

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct Job {
    pub id: u64,
    pub created_at: DateTime<Utc>,
    pub allow_failure: bool,
    pub name: String,
    #[serde(rename = "ref")]
    pub branch: String,
    pub stage: String,
    pub status: String,
    pub web_url: String,
    pub pipeline: Pipeline,
    pub commit: Commit,
    pub user: User,
}

#[cfg(test)]
mod tests {
    use serde_json::json;

    use crate::model::{Job, test};

    #[test]
    fn job_deserialize() {
        let value = json!({
            "id": 6995103065_i64,
            "status": "canceled",
            "stage": "deploy",
            "name": "pages",
            "ref": "master",
            "tag": false,
            "coverage": null,
            "allow_failure": false,
            "created_at": "2024-06-01T10:44:53.122Z",
            "started_at": "2024-06-01T10:44:53.849Z",
            "finished_at": "2024-06-01T10:45:16.765Z",
            "erased_at": null,
            "duration": 22.915853,
            "queued_duration": 0.473594,
            "user": {
                "id": 13081321,
                "username": "gitlab.ci.dashboard",
                "name": "Gitlab CI Dashboard",
                "state": "active",
                "locked": false,
                "avatar_url": "avatar_url",
                "web_url": "web_url",
                "created_at": "2022-11-18T17:46:13.632Z",
                "bio": "",
                "location": "",
                "public_email": "",
                "skype": "",
                "linkedin": "",
                "twitter": "",
                "discord": "",
                "website_url": "",
                "organization": "",
                "job_title": "",
                "pronouns": "",
                "bot": false,
                "work_information": null,
                "followers": 0,
                "following": 0,
                "local_time": "7:12 PM"
            },
            "commit": {
                "id": "6797a390bf73f89096af2e1dbade0a23a89e3a9e",
                "short_id": "6797a390",
                "created_at": "2024-06-01T10:41:16.000+00:00",
                "parent_ids": [
                    "97a41ecb5ff1e1f75cf24952511c59c18e376b9c"
                ],
                "title": "Update .gitlab-ci.yml file",
                "message": "Update .gitlab-ci.yml file",
                "author_name": "Gitlab CI Dashboard",
                "author_email": "gitlab.ci.dashboard@gmail.com",
                "authored_date": "2024-06-01T10:41:16.000+00:00",
                "committer_name": "Gitlab CI Dashboard",
                "committer_email": "gitlab.ci.dashboard@gmail.com",
                "committed_date": "2024-06-01T10:41:16.000+00:00",
                "trailers": {},
                "extended_trailers": {},
                "web_url": "web_url"
            },
            "pipeline": {
                "id": 1314378511,
                "iid": 6,
                "project_id": 41558386,
                "sha": "6797a390bf73f89096af2e1dbade0a23a89e3a9e",
                "ref": "master",
                "status": "canceled",
                "source": "web",
                "created_at": "2024-06-01T10:44:53.114Z",
                "updated_at": "2024-06-01T10:45:16.894Z",
                "web_url": "web_url"
            },
            "web_url": "web_url",
            "project": {
                "ci_job_token_scope_enabled": false
            },
            "artifacts_file": {
                "filename": "artifacts.zip",
                "size": 1080
            },
            "artifacts": [
                {
                    "file_type": "archive",
                    "size": 1080,
                    "filename": "artifacts.zip",
                    "file_format": "zip"
                },
                {
                    "file_type": "metadata",
                    "size": 217,
                    "filename": "metadata.gz",
                    "file_format": "gzip"
                },
                {
                    "file_type": "trace",
                    "size": 2787,
                    "filename": "job.log",
                    "file_format": null
                }
            ],
            "runner": {
                "id": 12270857,
                "description": "4-green.saas-linux-small-amd64.runners-manager.gitlab.com/default",
                "ip_address": null,
                "active": true,
                "paused": false,
                "is_shared": true,
                "runner_type": "instance_type",
                "name": "gitlab-runner",
                "online": true,
                "status": "online"
            },
            "runner_manager": {
                "id": 24719424,
                "system_id": "s_8990de21c550",
                "version": "17.0.0~pre.88.g761ae5dd",
                "revision": "761ae5dd",
                "platform": "linux",
                "architecture": "amd64",
                "created_at": "2024-05-08T09:54:02.061Z",
                "contacted_at": "2024-06-01T17:12:36.858Z",
                "ip_address": "10.1.5.252",
                "status": "online"
            },
            "artifacts_expire_at": "2024-07-01T10:45:13.288Z",
            "archived": false,
            "tag_list": []
        });

        let deserialized = serde_json::from_value::<Job>(value).unwrap();
        assert_eq!(deserialized.id, 6995103065);
    }

    #[test]
    fn job_serialize() {
        let value = test::new_job();

        let json = serde_json::to_string(&value).unwrap();
        let expected = "{\"id\":1,\"created_at\":\"1970-01-01T00:00:00Z\",\"allow_failure\":false,\"name\":\"name\",\"ref\":\"branch\",\"stage\":\"stage\",\"status\":\"status\",\"web_url\":\"web_url\",\"pipeline\":{\"id\":1,\"iid\":2,\"project_id\":3,\"sha\":\"sha\",\"ref\":\"branch\",\"status\":\"status\",\"source\":\"source\",\"created_at\":\"1970-01-01T00:00:00Z\",\"updated_at\":\"1970-01-01T00:00:00Z\",\"web_url\":\"web_url\"},\"commit\":{\"id\":\"id\",\"author_name\":\"author_name\",\"committer_name\":\"committer_name\",\"committed_date\":\"1970-01-01T00:00:00Z\",\"title\":\"title\",\"message\":\"message\"},\"user\":{\"id\":123,\"username\":\"username\",\"name\":\"name\",\"state\":\"state\",\"is_admin\":false}}";
        assert_eq!(expected, json);
    }
}
