package schedule

import (
	"log"

	"github.com/larscom/gitlab-ci-dashboard/model"
	"github.com/larscom/gitlab-ci-dashboard/util"
	"github.com/xanzy/go-gitlab"
)

type GitlabClient interface {
	ListPipelineSchedules(projectId int, opts *gitlab.ListPipelineSchedulesOptions) ([]model.Schedule, *gitlab.Response, error)
}

type gitlabClient struct {
	gitlab *gitlab.Client
}

func NewGitlabClient(gitlab *gitlab.Client) GitlabClient {
	return &gitlabClient{
		gitlab: gitlab,
	}
}

func (c *gitlabClient) ListPipelineSchedules(projectId int, options *gitlab.ListPipelineSchedulesOptions) ([]model.Schedule, *gitlab.Response, error) {
	schedules, response, err := c.gitlab.PipelineSchedules.ListPipelineSchedules(projectId, options)
	if err != nil {
		return util.HandleError(make([]model.Schedule, 0), response, err)
	}

	p, err := util.Convert(schedules, make([]model.Schedule, 0))
	if err != nil {
		log.Panicf("unexpected JSON: %v", err)
	}

	return p, response, err
}
