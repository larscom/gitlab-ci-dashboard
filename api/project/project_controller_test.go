package project

import (
	"net/http"
	"net/http/httptest"
	"regexp"
	"testing"

	"github.com/labstack/echo/v4"
	"github.com/larscom/gitlab-ci-dashboard/model"
	"github.com/stretchr/testify/assert"
	"github.com/xanzy/go-gitlab"
)

type ProjectServiceMock struct{}

func (p *ProjectServiceMock) GetProjectsGroupedByStatus(groupId int) map[string][]*model.ProjectWithLatestPipeline {
	return map[string][]*model.ProjectWithLatestPipeline{
		"success": {{Project: &gitlab.Project{ID: 13, Namespace: &gitlab.ProjectNamespace{
			ID: groupId,
		}}, Pipeline: &gitlab.PipelineInfo{ID: 33}}},
	}
}

func TestGetProjectsGroupedByStatus(t *testing.T) {
	req := httptest.NewRequest(http.MethodGet, "/", nil)
	rec := httptest.NewRecorder()

	e := echo.New()
	c := e.NewContext(req, rec)

	c.SetPath("/:groupId/projects")
	c.SetParamNames("groupId")
	c.SetParamValues("22")

	controller := NewProjectController(&ProjectServiceMock{})

	if assert.NoError(t, controller.GetProjectsGroupedByStatus(c)) {
		assert.Equal(t, http.StatusOK, rec.Code)

		r := regexp.MustCompile("\\s")

		expected := `{"success":[{"project":{"id":13,"description":"","default_branch":"","public":false,"visibility":"","ssh_url_to_repo":"","http_url_to_repo":"","web_url":"","readme_url":"","tag_list":null,"topics":null,"owner":null,"name":"","name_with_namespace":"","path":"","path_with_namespace":"","issues_enabled":false,"open_issues_count":0,"merge_requests_enabled":false,"approvals_before_merge":0,"jobs_enabled":false,"wiki_enabled":false,"snippets_enabled":false,"resolve_outdated_diff_discussions":false,"container_registry_enabled":false,"container_registry_access_level":"","creator_id":0,"namespace":{"id":22,"name":"","path":"","kind":"","full_path":"","parent_id":0,"avatar_url":"","web_url":""},"import_status":"","import_error":"","permissions":null,"marked_for_deletion_at":null,"empty_repo":false,"archived":false,"avatar_url":"","license_url":"","license":null,"shared_runners_enabled":false,"forks_count":0,"star_count":0,"runners_token":"","public_jobs":false,"allow_merge_on_skipped_pipeline":false,"only_allow_merge_if_pipeline_succeeds":false,"only_allow_merge_if_all_discussions_are_resolved":false,"remove_source_branch_after_merge":false,"printing_merge_request_link_enabled":false,"lfs_enabled":false,"repository_storage":"","request_access_enabled":false,"merge_method":"","forked_from_project":null,"mirror":false,"mirror_user_id":0,"mirror_trigger_builds":false,"only_mirror_protected_branches":false,"mirror_overwrites_diverged_branches":false,"packages_enabled":false,"service_desk_enabled":false,"service_desk_address":"","issues_access_level":"","repository_access_level":"","merge_requests_access_level":"","forking_access_level":"","wiki_access_level":"","builds_access_level":"","snippets_access_level":"","pages_access_level":"","operations_access_level":"","analytics_access_level":"","autoclose_referenced_issues":false,"suggestion_commit_message":"","auto_cancel_pending_pipelines":"","ci_forward_deployment_enabled":false,"squash_option":"","shared_with_groups":null,"statistics":null,"ci_config_path":"","ci_default_git_depth":0,"ci_separated_caches":false,"custom_attributes":null,"compliance_frameworks":null,"build_coverage_regex":"","build_timeout":0,"issues_template":"","merge_requests_template":"","keep_latest_artifact":false,"merge_pipelines_enabled":false,"merge_trains_enabled":false,"restrict_user_defined_variables":false,"merge_commit_template":"","squash_commit_template":"","auto_devops_deploy_strategy":"","auto_devops_enabled":false,"build_git_strategy":"","emails_disabled":false,"external_authorization_classification_label":"","requirements_access_level":"","security_and_compliance_access_level":"","mr_default_target_self":false,"public_builds":false},"pipeline":{"id":33,"project_id":0,"status":"","source":"","ref":"","sha":"","web_url":"","updated_at":null,"created_at":null}}]}`
		assert.Equal(t, r.ReplaceAllString(string(expected), ""), r.ReplaceAllString(rec.Body.String(), ""))
	}
}
