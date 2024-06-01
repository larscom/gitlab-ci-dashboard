use serde::{Deserialize, Serialize};

use crate::model::commit::Commit;
use crate::model::Pipeline;

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct Branch {
    pub name: String,
    pub merged: bool,
    pub protected: bool,
    pub default: bool,
    pub can_push: bool,
    pub web_url: String,
    pub commit: Commit,
}

#[derive(Clone, Debug, Serialize)]
pub struct BranchPipeline {
    pub branch: Branch,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub pipeline: Option<Pipeline>,
}

#[cfg(test)]
mod tests {
    use serde_json::json;

    use super::*;

    #[test]
    fn branch_deserialize() {
        let value = json!({
            "name": "branch-1",
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
            "merged": false,
            "protected": false,
            "developers_can_push": false,
            "developers_can_merge": false,
            "can_push": true,
            "default": false,
            "web_url": "web_url"
        });

        let branch = serde_json::from_value::<Branch>(value).unwrap();
        assert_eq!(branch.name, "branch-1");
    }

    #[test]
    fn branch_serialize() {
        let branch = create_test_branch();

        let json = serde_json::to_string(&branch).unwrap();
        let expected = "{\"name\":\"branch-1\",\"merged\":false,\"protected\":false,\"default\":false,\"can_push\":false,\"web_url\":\"web_url\",\"commit\":{\"id\":\"1\",\"author_name\":\"author_name\",\"committer_name\":\"committer_name\",\"committed_date\":\"1970-01-01T00:00:00Z\",\"title\":\"title\",\"message\":\"message\"}}";
        assert_eq!(expected, json);
    }

    #[test]
    fn branch_pipeline_serialize_none_pipeline() {
        let branch_pipeline = BranchPipeline {
            branch: create_test_branch(),
            pipeline: None,
        };

        let json = serde_json::to_string(&branch_pipeline).unwrap();
        let expected = "{\"branch\":{\"name\":\"branch-1\",\"merged\":false,\"protected\":false,\"default\":false,\"can_push\":false,\"web_url\":\"web_url\",\"commit\":{\"id\":\"1\",\"author_name\":\"author_name\",\"committer_name\":\"committer_name\",\"committed_date\":\"1970-01-01T00:00:00Z\",\"title\":\"title\",\"message\":\"message\"}}}";
        assert_eq!(expected, json);
    }

    #[test]
    fn branch_pipeline_serialize_some_pipeline() {
        let branch_pipeline = BranchPipeline {
            branch: create_test_branch(),
            pipeline: Some(Pipeline {
                id: 1,
                iid: 2,
                project_id: 3,
                sha: "sha".to_string(),
                branch: "branch".to_string(),
                status: "status".to_string(),
                source: "source".to_string(),
                created_at: Default::default(),
                updated_at: Default::default(),
                web_url: "web_url".to_string(),
            }),
        };

        let json = serde_json::to_string(&branch_pipeline).unwrap();
        let expected = "{\"branch\":{\"name\":\"branch-1\",\"merged\":false,\"protected\":false,\"default\":false,\"can_push\":false,\"web_url\":\"web_url\",\"commit\":{\"id\":\"1\",\"author_name\":\"author_name\",\"committer_name\":\"committer_name\",\"committed_date\":\"1970-01-01T00:00:00Z\",\"title\":\"title\",\"message\":\"message\"}},\"pipeline\":{\"id\":1,\"iid\":2,\"project_id\":3,\"sha\":\"sha\",\"ref\":\"branch\",\"status\":\"status\",\"source\":\"source\",\"created_at\":\"1970-01-01T00:00:00Z\",\"updated_at\":\"1970-01-01T00:00:00Z\",\"web_url\":\"web_url\"}}";
        assert_eq!(expected, json);
    }

    fn create_test_branch() -> Branch {
        Branch {
            name: "branch-1".to_string(),
            merged: false,
            protected: false,
            default: false,
            can_push: false,
            web_url: "web_url".to_string(),
            commit: Commit {
                id: "1".to_string(),
                author_name: "author_name".to_string(),
                committer_name: "committer_name".to_string(),
                committed_date: Default::default(),
                title: "title".to_string(),
                message: "message".to_string(),
            },
        }
    }
}
