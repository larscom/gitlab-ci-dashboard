use serde::{Deserialize, Serialize};

use crate::model::Pipeline;

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct Project {
    pub id: u64,
    pub name: String,
    pub web_url: String,
    pub default_branch: Option<String>,
    pub topics: Vec<String>,
    pub namespace: Namespace
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct Namespace {
    pub id: u64,
    pub name: String,
    pub path: String
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct ProjectPipeline {
    pub group_id: u64,
    pub project: Project,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub pipeline: Option<Pipeline>,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct ProjectPipelines {
    pub group_id: u64,
    pub project: Project,
    pub pipelines: Vec<Pipeline>,
}

#[cfg(test)]
mod tests {
    use crate::model::{Project, ProjectPipeline, ProjectPipelines, test};

    #[test]
    fn project_deserialize() {
        let value = r#"
           {
            "id": 41558613,
            "description": "Example plain HTML site using GitLab Pages: https://pages.gitlab.io/plain-html",
            "name": "go-project-6",
            "name_with_namespace": "Go / go-project-6",
            "path": "go-project-6",
            "path_with_namespace": "go179/go-project-6",
            "created_at": "2022-12-02T18:43:00.305Z",
            "default_branch": "master",
            "tag_list": [],
            "topics": [],
            "ssh_url_to_repo": "git@gitlab.com:go179/go-project-6.git",
            "http_url_to_repo": "https://gitlab.com/go179/go-project-6.git",
            "web_url": "https://gitlab.com/go179/go-project-6",
            "readme_url": "https://gitlab.com/go179/go-project-6/-/blob/master/README.md",
            "forks_count": 0,
            "avatar_url": "https://gitlab.com/uploads/-/system/project/avatar/41558613/HTML5_Logo_512.png",
            "star_count": 0,
            "last_activity_at": "2022-12-02T18:43:00.305Z",
            "namespace": {
                "id": 61012723,
                "name": "Go",
                "path": "go179",
                "kind": "group",
                "full_path": "go179",
                "parent_id": null,
                "avatar_url": null,
                "web_url": "https://gitlab.com/groups/go179"
            },
            "container_registry_image_prefix": "registry.gitlab.com/go179/go-project-6",
            "_links": {
                "self": "https://gitlab.com/api/v4/projects/41558613",
                "issues": "https://gitlab.com/api/v4/projects/41558613/issues",
                "merge_requests": "https://gitlab.com/api/v4/projects/41558613/merge_requests",
                "repo_branches": "https://gitlab.com/api/v4/projects/41558613/repository/branches",
                "labels": "https://gitlab.com/api/v4/projects/41558613/labels",
                "events": "https://gitlab.com/api/v4/projects/41558613/events",
                "members": "https://gitlab.com/api/v4/projects/41558613/members",
                "cluster_agents": "https://gitlab.com/api/v4/projects/41558613/cluster_agents"
            },
            "packages_enabled": true,
            "empty_repo": false,
            "archived": false,
            "visibility": "public",
            "resolve_outdated_diff_discussions": null,
            "container_expiration_policy": {
                "cadence": "1d",
                "enabled": false,
                "keep_n": 10,
                "older_than": "90d",
                "name_regex": ".*",
                "name_regex_keep": null,
                "next_run_at": "2022-12-03T18:43:00.330Z"
            },
            "repository_object_format": "sha1",
            "issues_enabled": true,
            "merge_requests_enabled": true,
            "wiki_enabled": false,
            "jobs_enabled": true,
            "snippets_enabled": false,
            "container_registry_enabled": false,
            "service_desk_enabled": null,
            "service_desk_address": "contact-project+go179-go-project-6-41558613-issue-@incoming.gitlab.com",
            "can_create_merge_request_in": true,
            "issues_access_level": "enabled",
            "repository_access_level": "enabled",
            "merge_requests_access_level": "enabled",
            "forking_access_level": "enabled",
            "wiki_access_level": "disabled",
            "builds_access_level": "enabled",
            "snippets_access_level": "disabled",
            "pages_access_level": "public",
            "analytics_access_level": "enabled",
            "container_registry_access_level": "disabled",
            "security_and_compliance_access_level": "private",
            "releases_access_level": "enabled",
            "environments_access_level": "enabled",
            "feature_flags_access_level": "enabled",
            "infrastructure_access_level": "enabled",
            "monitor_access_level": "enabled",
            "model_experiments_access_level": "enabled",
            "model_registry_access_level": "enabled",
            "emails_disabled": false,
            "emails_enabled": true,
            "shared_runners_enabled": true,
            "lfs_enabled": true,
            "creator_id": 13081321,
            "import_url": null,
            "import_type": "gitlab_project",
            "import_status": "finished",
            "open_issues_count": 0,
            "description_html": "<p data-sourcepos=\"1:1-1:78\" dir=\"auto\">Example plain HTML site using GitLab Pages: <a href=\"https://pages.gitlab.io/plain-html\" rel=\"nofollow noreferrer noopener\" target=\"_blank\">https://pages.gitlab.io/plain-html</a></p>",
            "updated_at": "2023-11-10T16:51:20.832Z",
            "ci_default_git_depth": 20,
            "ci_forward_deployment_enabled": true,
            "ci_forward_deployment_rollback_allowed": true,
            "ci_job_token_scope_enabled": false,
            "ci_separated_caches": true,
            "ci_allow_fork_pipelines_to_run_in_parent_project": true,
            "build_git_strategy": "fetch",
            "keep_latest_artifact": true,
            "restrict_user_defined_variables": false,
            "ci_pipeline_variables_minimum_override_role": "maintainer",
            "runners_token": null,
            "runner_token_expiration_interval": null,
            "group_runners_enabled": true,
            "auto_cancel_pending_pipelines": "enabled",
            "build_timeout": 3600,
            "auto_devops_enabled": false,
            "auto_devops_deploy_strategy": "continuous",
            "ci_config_path": "",
            "public_jobs": true,
            "shared_with_groups": [],
            "only_allow_merge_if_pipeline_succeeds": false,
            "allow_merge_on_skipped_pipeline": null,
            "request_access_enabled": false,
            "only_allow_merge_if_all_discussions_are_resolved": false,
            "remove_source_branch_after_merge": true,
            "printing_merge_request_link_enabled": true,
            "merge_method": "merge",
            "squash_option": "default_off",
            "enforce_auth_checks_on_uploads": true,
            "suggestion_commit_message": null,
            "merge_commit_template": null,
            "squash_commit_template": null,
            "issue_branch_template": null,
            "warn_about_potentially_unwanted_characters": true,
            "autoclose_referenced_issues": true,
            "external_authorization_classification_label": "",
            "requirements_enabled": false,
            "requirements_access_level": "enabled",
            "security_and_compliance_enabled": true,
            "compliance_frameworks": []
        }"#;

        let deserialized = serde_json::from_str::<Project>(value).unwrap();
        assert_eq!(deserialized.id, 41558613);
    }

    #[test]
    fn project_serialize() {
        let value = test::new_project();

        let json = serde_json::to_string(&value).unwrap();
        let expected = "{\"id\":456,\"name\":\"name\",\"web_url\":\"web_url\",\"default_branch\":\"default_branch\",\"topics\":[\"topic\"],\"namespace\":{\"id\":123,\"name\":\"namespace\",\"path\":\"namespace\"}}";

        assert_eq!(expected, json);
    }

    #[test]
    fn project_pipeline_serialize_none_pipeline() {
        let value = ProjectPipeline {
            group_id: 1,
            project: test::new_project(),
            pipeline: None,
        };

        let json = serde_json::to_string(&value).unwrap();
        let expected = "{\"group_id\":1,\"project\":{\"id\":456,\"name\":\"name\",\"web_url\":\"web_url\",\"default_branch\":\"default_branch\",\"topics\":[\"topic\"],\"namespace\":{\"id\":123,\"name\":\"namespace\",\"path\":\"namespace\"}}}";

        assert_eq!(expected, json);
    }

    #[test]
    fn project_pipeline_serialize_some_pipeline() {
        let value = ProjectPipeline {
            group_id: 1,
            project: test::new_project(),
            pipeline: Some(test::new_pipeline()),
        };

        let json = serde_json::to_string(&value).unwrap();
        let expected = "{\"group_id\":1,\"project\":{\"id\":456,\"name\":\"name\",\"web_url\":\"web_url\",\"default_branch\":\"default_branch\",\"topics\":[\"topic\"],\"namespace\":{\"id\":123,\"name\":\"namespace\",\"path\":\"namespace\"}},\"pipeline\":{\"id\":1,\"iid\":2,\"project_id\":3,\"sha\":\"sha\",\"ref\":\"branch\",\"status\":\"running\",\"source\":\"web\",\"created_at\":\"1970-01-01T00:00:00Z\",\"updated_at\":\"1970-01-01T00:00:00Z\",\"web_url\":\"web_url\"}}";
        assert_eq!(expected, json);
    }

    #[test]
    fn project_pipelines_serialize() {
        let value = ProjectPipelines {
            group_id: 1,
            project: test::new_project(),
            pipelines: vec![test::new_pipeline()],
        };

        let json = serde_json::to_string(&value).unwrap();
        let expected = "{\"group_id\":1,\"project\":{\"id\":456,\"name\":\"name\",\"web_url\":\"web_url\",\"default_branch\":\"default_branch\",\"topics\":[\"topic\"],\"namespace\":{\"id\":123,\"name\":\"namespace\",\"path\":\"namespace\"}},\"pipelines\":[{\"id\":1,\"iid\":2,\"project_id\":3,\"sha\":\"sha\",\"ref\":\"branch\",\"status\":\"running\",\"source\":\"web\",\"created_at\":\"1970-01-01T00:00:00Z\",\"updated_at\":\"1970-01-01T00:00:00Z\",\"web_url\":\"web_url\"}]}";

        assert_eq!(expected, json);
    }
}
