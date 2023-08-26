package pipeline

import (
	"github.com/larscom/gitlab-ci-dashboard/config"
	"github.com/larscom/gitlab-ci-dashboard/data"
	"github.com/larscom/gitlab-ci-dashboard/util"
	"github.com/xanzy/go-gitlab"
	"log"
)

type GitlabClient interface {
	GetLatestPipeline(projectId int, opts *gitlab.GetLatestPipelineOptions) (*data.Pipeline, *gitlab.Response, error)

	ListProjectPipelines(projectId int, opts *gitlab.ListProjectPipelinesOptions) ([]data.Pipeline, *gitlab.Response, error)
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

func (c *GitlabClientImpl) GetLatestPipeline(projectId int, options *gitlab.GetLatestPipelineOptions) (*data.Pipeline, *gitlab.Response, error) {
	pipeline, response, err := c.client.Pipelines.GetLatestPipeline(projectId, options)
	if err != nil {
		return util.HandleError[*data.Pipeline](nil, response, err)
	}

	p, err := util.Convert(pipeline, new(data.Pipeline))
	if err != nil {
		log.Panicf("unexpected JSON: %v", err)
	}

	return p, response, err
}

func (c *GitlabClientImpl) ListProjectPipelines(projectId int, options *gitlab.ListProjectPipelinesOptions) ([]data.Pipeline, *gitlab.Response, error) {
	pipelines, response, err := c.client.Pipelines.ListProjectPipelines(projectId, options)
	if err != nil {
		return util.HandleError(make([]data.Pipeline, 0), response, err)
	}

	p, err := util.Convert(pipelines, make([]data.Pipeline, 0))
	if err != nil {
		log.Panicf("unexpected JSON: %v", err)
	}

	return p, response, err
}
