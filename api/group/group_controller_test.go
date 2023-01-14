package group

import (
	"net/http"
	"net/http/httptest"
	"regexp"
	"testing"

	"github.com/labstack/echo/v4"
	"github.com/stretchr/testify/assert"
	"github.com/xanzy/go-gitlab"
)

type GroupServiceMock struct{}

func (p *GroupServiceMock) GetGroups() []*gitlab.Group {
	return []*gitlab.Group{{ID: 33}}
}

func TestGetGroups(t *testing.T) {
	req := httptest.NewRequest(http.MethodGet, "/", nil)
	rec := httptest.NewRecorder()

	e := echo.New()
	c := e.NewContext(req, rec)

	controller := NewGroupController(&GroupServiceMock{})

	if assert.NoError(t, controller.GetGroups(c)) {
		assert.Equal(t, http.StatusOK, rec.Code)

		r := regexp.MustCompile("\\s")

		expected := `[{"id":33,"name":"","path":"","description":"","membership_lock":false,"visibility":"","lfs_enabled":false,"default_branch_protection":0,"avatar_url":"","web_url":"","request_access_enabled":false,"full_name":"","full_path":"","file_template_project_id":0,"parent_id":0,"projects":null,"statistics":null,"custom_attributes":null,"share_with_group_lock":false,"require_two_factor_authentication":false,"two_factor_grace_period":0,"project_creation_level":"","auto_devops_enabled":false,"subgroup_creation_level":"","emails_disabled":false,"mentions_disabled":false,"runners_token":"","shared_projects":null,"shared_runners_enabled":false,"shared_with_groups":null,"ldap_cn":"","ldap_access":0,"ldap_group_links":null,"saml_group_links":null,"shared_runners_minutes_limit":0,"extra_shared_runners_minutes_limit":0,"prevent_forking_outside_group":false,"marked_for_deletion_on":null,"created_at":null,"ip_restriction_ranges":""}]`
		assert.Equal(t, r.ReplaceAllString(string(expected), ""), r.ReplaceAllString(rec.Body.String(), ""))
	}
}
