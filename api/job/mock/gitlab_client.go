package mock

import (
	"errors"

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

func (c *GitlabClientMock) ListPipelineJobs(projectId int, pipelineId int, options *gitlab.ListJobsOptions) ([]model.Job, *gitlab.Response, error) {
	if c.Error != nil {
		return make([]model.Job, 0), nil, c.Error
	}

	response := &gitlab.Response{TotalPages: c.TotalPages, NextPage: options.Page + 1}

	if projectId == 1 && pipelineId == 2 && options.Page == 1 && options.PerPage == 100 {
		for _, scope := range *options.Scope {
			if scope == gitlab.Success {
				return []model.Job{{Name: "job-1"}, {Name: "job-2"}}, response, nil
			}
		}
		return make([]model.Job, 0), nil, errors.New("failed getting jobs")
	}

	if projectId == 1 && pipelineId == 2 && options.Page == 2 && options.PerPage == 100 {
		return []model.Job{{Name: "job-3"}, {Name: "job-4"}}, response, nil
	}

	return make([]model.Job, 0), nil, nil
}
