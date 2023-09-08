package mock

import (
	"fmt"
	"github.com/larscom/gitlab-ci-dashboard/model"
	"github.com/xanzy/go-gitlab"
)

func NewGitlabClientMock(totalPages int, err error) *GitlabClientMock {
	return &GitlabClientMock{
		TotalPages: totalPages,
		Error:      err,
	}
}

type GitlabClientMock struct {
	TotalPages int
	Error      error
}

func (c *GitlabClientMock) GetLatestPipeline(id model.ProjectId, options *gitlab.GetLatestPipelineOptions) (*model.Pipeline, *gitlab.Response, error) {
	if id == 1 && *options.Ref == "master" {
		return &model.Pipeline{Id: 123}, nil, nil
	}
	return nil, nil, fmt.Errorf("ERROR")
}

func (c *GitlabClientMock) ListProjectPipelines(id model.ProjectId, options *gitlab.ListProjectPipelinesOptions) ([]model.Pipeline, *gitlab.Response, error) {
	if c.Error != nil {
		return make([]model.Pipeline, 0), nil, c.Error
	}

	response := &gitlab.Response{TotalPages: c.TotalPages, NextPage: options.Page + 1}
	if options.Page == 1 && options.PerPage == 100 {
		return []model.Pipeline{{Id: 111, Status: "success"}, {Id: 222, Status: "failed"}}, response, nil
	}
	if options.Page == 2 && options.PerPage == 100 {
		return []model.Pipeline{{Id: 333, Status: "failed"}, {Id: 444, Status: "success"}}, response, nil
	}

	if id == 1 && *options.Ref == "master" && *options.Source == "schedule" {
		return []model.Pipeline{{Id: 456}}, nil, nil
	} else if *options.Source == "web" {
		return make([]model.Pipeline, 0), nil, nil
	}

	return nil, nil, fmt.Errorf("ERROR")
}
