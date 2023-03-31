package branch

import (
	"testing"

	"github.com/larscom/gitlab-ci-dashboard/model"
	"github.com/larscom/gitlab-ci-dashboard/test"
	"github.com/stretchr/testify/assert"
	"github.com/xanzy/go-gitlab"
)

func createMockGitlabClient(totalPages int) *MockGitlabClient {
	return &MockGitlabClient{totalPages}
}

type MockGitlabClient struct {
	totalPages int
}

func (c *MockGitlabClient) ListBranches(projectId int, options *gitlab.ListBranchesOptions) ([]*model.Branch, *gitlab.Response, error) {
	if projectId != 1 {
		return make([]*model.Branch, 0), nil, nil
	}

	response := &gitlab.Response{TotalPages: c.totalPages, NextPage: options.Page + 1}
	if options.Page == 1 && options.PerPage == 100 {
		branches_1, _ := test.NewStruct("testdata/branches_1.json", make([]*model.Branch, 0))
		return branches_1, response, nil
	}
	if options.Page == 2 && options.PerPage == 100 {
		branches_2, _ := test.NewStruct("testdata/branches_2.json", make([]*model.Branch, 0))
		return branches_2, response, nil
	}

	return make([]*model.Branch, 0), nil, nil
}
func (c *MockGitlabClient) ListGroups(*gitlab.ListGroupsOptions) ([]*model.Group, *gitlab.Response, error) {
	return make([]*model.Group, 0), nil, nil
}
func (c *MockGitlabClient) GetGroup(int, *gitlab.GetGroupOptions) (*model.Group, *gitlab.Response, error) {
	return nil, nil, nil
}
func (c *MockGitlabClient) GetLatestPipeline(int, *gitlab.GetLatestPipelineOptions) (*model.Pipeline, *gitlab.Response, error) {
	return nil, nil, nil
}
func (c *MockGitlabClient) ListGroupProjects(int, *gitlab.ListGroupProjectsOptions) ([]*model.Project, *gitlab.Response, error) {
	return make([]*model.Project, 0), nil, nil
}

func TestGetBranchesWith1Page(t *testing.T) {
	const totalPages = 1
	client := NewBranchClient(createMockGitlabClient(totalPages))

	branches := client.GetBranches(1)

	assert.Len(t, branches, 2)
	assert.Equal(t, "feature-1", branches[0].Name)
	assert.Equal(t, "feature-2", branches[1].Name)
}

func TestGetBranchesWith2Pages(t *testing.T) {
	const totalPages = 2
	client := NewBranchClient(createMockGitlabClient(totalPages))

	branches := client.GetBranches(1)

	assert.Len(t, branches, 4)
	assert.Equal(t, "feature-1", branches[0].Name)
	assert.Equal(t, "feature-2", branches[1].Name)
	assert.Equal(t, "feature-3", branches[2].Name)
	assert.Equal(t, "feature-4", branches[3].Name)
}
