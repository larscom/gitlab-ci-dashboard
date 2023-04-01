package mock

import (
	"github.com/larscom/gitlab-ci-dashboard/model"
	"github.com/xanzy/go-gitlab"
)

func CreateMockGitlabClient(TotalPages int, err error) *MockGitlabClient {
	return &MockGitlabClient{TotalPages, err}
}

type MockGitlabClient struct {
	TotalPages int
	err        error
}

func (c *MockGitlabClient) ListBranches(projectId int, options *gitlab.ListBranchesOptions) ([]*model.Branch, *gitlab.Response, error) {
	if c.err != nil {
		return make([]*model.Branch, 0), nil, c.err
	}

	response := &gitlab.Response{TotalPages: c.TotalPages, NextPage: options.Page + 1}

	if options.Page == 1 && options.PerPage == 100 {
		return []*model.Branch{{Name: "branch-1"}, {Name: "branch-2"}}, response, nil
	}
	if options.Page == 2 && options.PerPage == 100 {
		return []*model.Branch{{Name: "branch-3"}, {Name: "branch-4"}}, response, nil
	}

	return make([]*model.Branch, 0), nil, nil
}
func (c *MockGitlabClient) ListGroups(options *gitlab.ListGroupsOptions) ([]*model.Group, *gitlab.Response, error) {
	if c.err != nil {
		return make([]*model.Group, 0), nil, c.err
	}

	response := &gitlab.Response{TotalPages: c.TotalPages, NextPage: options.Page + 1}

	if options.Page == 1 && options.PerPage == 100 {
		return []*model.Group{{Name: "group-1"}, {Name: "group-2"}}, response, nil
	}
	if options.Page == 2 && options.PerPage == 100 {
		return []*model.Group{{Name: "group-3"}, {Name: "group-4"}}, response, nil
	}

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
