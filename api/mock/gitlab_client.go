package mock

import (
	"fmt"

	"github.com/larscom/gitlab-ci-dashboard/model"
	"github.com/xanzy/go-gitlab"
)

func NewGitlabClient(TotalPages int, err error) *GitlabClient {
	return &GitlabClient{
		TotalPages,
		err,
	}
}

type GitlabClient struct {
	TotalPages int
	err        error
}

func (c *GitlabClient) ListBranches(projectId int, options *gitlab.ListBranchesOptions) ([]model.Branch, *gitlab.Response, error) {
	if c.err != nil {
		return make([]model.Branch, 0), nil, c.err
	}

	response := &gitlab.Response{TotalPages: c.TotalPages, NextPage: options.Page + 1}

	if projectId == 1 && options.Page == 1 && options.PerPage == 100 {
		return []model.Branch{{Name: "branch-1"}, {Name: "branch-2"}}, response, nil
	}
	if projectId == 1 && options.Page == 2 && options.PerPage == 100 {
		return []model.Branch{{Name: "branch-3"}, {Name: "branch-4"}}, response, nil
	}

	return make([]model.Branch, 0), nil, nil
}

func (c *GitlabClient) ListGroups(options *gitlab.ListGroupsOptions) ([]model.Group, *gitlab.Response, error) {
	if c.err != nil {
		return make([]model.Group, 0), nil, c.err
	}

	response := &gitlab.Response{TotalPages: c.TotalPages, NextPage: options.Page + 1}

	if len(*options.SkipGroups) > 0 {
		return []model.Group{{Name: "group-10"}, {Name: "group-11"}}, response, nil
	}
	if *options.TopLevelOnly {
		return []model.Group{{Name: "group-20"}, {Name: "group-21"}}, response, nil
	}

	if options.Page == 1 && options.PerPage == 100 {
		return []model.Group{{Name: "group-1"}, {Name: "group-2"}}, response, nil
	}
	if options.Page == 2 && options.PerPage == 100 {
		return []model.Group{{Name: "group-3"}, {Name: "group-4"}}, response, nil
	}

	return make([]model.Group, 0), nil, nil
}

func (c *GitlabClient) GetGroup(groupId int, options *gitlab.GetGroupOptions) (*model.Group, *gitlab.Response, error) {
	if groupId == 1 && !*options.WithProjects {
		return &model.Group{Name: "group-1"}, nil, nil
	}
	if groupId == 2 && !*options.WithProjects {
		return &model.Group{Name: "group-2"}, nil, nil
	}
	return nil, nil, nil
}

func (c *GitlabClient) GetLatestPipeline(projectId int, options *gitlab.GetLatestPipelineOptions) (*model.Pipeline, *gitlab.Response, error) {
	if projectId == 1 && *options.Ref == "master" {
		return &model.Pipeline{Id: 123}, nil, nil
	}
	return nil, nil, fmt.Errorf("ERROR")
}

func (c *GitlabClient) ListProjectPipelines(projectId int, options *gitlab.ListProjectPipelinesOptions) ([]model.Pipeline, *gitlab.Response, error) {
	if c.err != nil {
		return make([]model.Pipeline, 0), nil, c.err
	}

	response := &gitlab.Response{TotalPages: c.TotalPages, NextPage: options.Page + 1}
	if options.Page == 1 && options.PerPage == 100 {
		return []model.Pipeline{{Id: 111, Status: "success"}, {Id: 222, Status: "failed"}}, response, nil
	}
	if options.Page == 2 && options.PerPage == 100 {
		return []model.Pipeline{{Id: 333, Status: "failed"}, {Id: 444, Status: "success"}}, response, nil
	}

	if projectId == 1 && *options.Ref == "master" && *options.Source == "schedule" {
		return []model.Pipeline{{Id: 456}}, nil, nil
	} else if *options.Source == "web" {
		return make([]model.Pipeline, 0), nil, nil
	}

	return nil, nil, fmt.Errorf("ERROR")
}

func (c *GitlabClient) ListGroupProjects(groupId int, options *gitlab.ListGroupProjectsOptions) ([]model.Project, *gitlab.Response, error) {
	if c.err != nil {
		return make([]model.Project, 0), nil, c.err
	}

	response := &gitlab.Response{TotalPages: c.TotalPages, NextPage: options.Page + 1}

	if groupId == 1 && options.Page == 1 && options.PerPage == 100 && !*options.Archived {
		return []model.Project{{Name: "project-1"}, {Name: "project-2"}}, response, nil
	}
	if groupId == 1 && options.Page == 2 && options.PerPage == 100 && !*options.Archived {
		return []model.Project{{Name: "project-3"}, {Name: "project-4"}}, response, nil
	}

	return make([]model.Project, 0), nil, nil
}

func (c *GitlabClient) ListPipelineSchedules(projectId int, options *gitlab.ListPipelineSchedulesOptions) ([]model.Schedule, *gitlab.Response, error) {
	if c.err != nil {
		return make([]model.Schedule, 0), nil, c.err
	}

	response := &gitlab.Response{TotalPages: c.TotalPages, NextPage: options.Page + 1}

	if projectId == 1 && options.Page == 1 && options.PerPage == 100 {
		return []model.Schedule{{Id: 1}, {Id: 2}}, response, nil
	}
	if projectId == 1 && options.Page == 2 && options.PerPage == 100 {
		return []model.Schedule{{Id: 3}, {Id: 4}}, response, nil
	}

	return make([]model.Schedule, 0), nil, nil
}
