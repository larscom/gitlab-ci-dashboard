package schedule

import (
	"github.com/larscom/gitlab-ci-dashboard/config"
	"github.com/larscom/gitlab-ci-dashboard/data"
	"github.com/larscom/gitlab-ci-dashboard/util"
	"github.com/xanzy/go-gitlab"
	"log"
)

type GitlabClient interface {
	ListPipelineSchedules(projectId int, opts *gitlab.ListPipelineSchedulesOptions) ([]data.Schedule, *gitlab.Response, error)
}

type GitlabClientImpl struct {
	client *gitlab.Client
}

func NewGitlabClient(config *config.GitlabConfig) GitlabClient {
	client, err := gitlab.NewClient(config.GitlabToken, gitlab.WithBaseURL(config.GitlabUrl))
	if err != nil {
		log.Panicf("failed to create gitlab client: %v", err)
	}

	return &GitlabClientImpl{
		client,
	}
}

func (c *GitlabClientImpl) ListPipelineSchedules(projectId int, options *gitlab.ListPipelineSchedulesOptions) ([]data.Schedule, *gitlab.Response, error) {
	schedules, response, err := c.client.PipelineSchedules.ListPipelineSchedules(projectId, options)
	if err != nil {
		return util.HandleError(make([]data.Schedule, 0), response, err)
	}

	p, err := util.Convert(schedules, make([]data.Schedule, 0))
	if err != nil {
		log.Panicf("unexpected JSON: %v", err)
	}

	return p, response, err
}
