package schedule

import (
	"github.com/larscom/gitlab-ci-dashboard/model"
	"github.com/larscom/gitlab-ci-dashboard/util"
	"github.com/xanzy/go-gitlab"
	"log"
)

type GitlabClient interface {
	ListPipelineSchedules(model.ProjectId, *gitlab.ListPipelineSchedulesOptions) ([]model.Schedule, *gitlab.Response, error)
}

type GitlabClientImpl struct {
	client *gitlab.Client
}

func NewGitlabClient(client *gitlab.Client) GitlabClient {
	return &GitlabClientImpl{
		client,
	}
}

func (c *GitlabClientImpl) ListPipelineSchedules(id model.ProjectId, options *gitlab.ListPipelineSchedulesOptions) ([]model.Schedule, *gitlab.Response, error) {
	schedules, response, err := c.client.PipelineSchedules.ListPipelineSchedules(id, options)
	if err != nil {
		return util.HandleError(make([]model.Schedule, 0), response, err)
	}

	p, err := util.Convert(schedules, make([]model.Schedule, 0))
	if err != nil {
		log.Panicf("unexpected JSON: %v", err)
	}

	return p, response, err
}
