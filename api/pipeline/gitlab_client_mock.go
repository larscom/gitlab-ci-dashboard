package pipeline

import (
	"fmt"
	"github.com/xanzy/go-gitlab"
)

func NewGitlabClientMock(TotalPages int, err error) *GitlabClientMock {
	return &GitlabClientMock{
		TotalPages,
		err,
	}
}

type GitlabClientMock struct {
	TotalPages int
	err        error
}

func (c *GitlabClientMock) GetLatestPipeline(projectId int, options *gitlab.GetLatestPipelineOptions) (*Pipeline, *gitlab.Response, error) {
	if projectId == 1 && *options.Ref == "master" {
		return &Pipeline{Id: 123}, nil, nil
	}
	return nil, nil, fmt.Errorf("ERROR")
}

func (c *GitlabClientMock) ListProjectPipelines(projectId int, options *gitlab.ListProjectPipelinesOptions) ([]Pipeline, *gitlab.Response, error) {
	if c.err != nil {
		return make([]Pipeline, 0), nil, c.err
	}

	response := &gitlab.Response{TotalPages: c.TotalPages, NextPage: options.Page + 1}
	if options.Page == 1 && options.PerPage == 100 {
		return []Pipeline{{Id: 111, Status: "success"}, {Id: 222, Status: "failed"}}, response, nil
	}
	if options.Page == 2 && options.PerPage == 100 {
		return []Pipeline{{Id: 333, Status: "failed"}, {Id: 444, Status: "success"}}, response, nil
	}

	if projectId == 1 && *options.Ref == "master" && *options.Source == "schedule" {
		return []Pipeline{{Id: 456}}, nil, nil
	} else if *options.Source == "web" {
		return make([]Pipeline, 0), nil, nil
	}

	return nil, nil, fmt.Errorf("ERROR")
}
