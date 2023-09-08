package pipeline

import (
	"github.com/larscom/gitlab-ci-dashboard/model"
	"github.com/larscom/gitlab-ci-dashboard/util"
	"github.com/xanzy/go-gitlab"
	"log"
)

type GitlabClient interface {
	GetLatestPipeline(model.ProjectId, *gitlab.GetLatestPipelineOptions) (*model.Pipeline, *gitlab.Response, error)

	ListProjectPipelines(model.ProjectId, *gitlab.ListProjectPipelinesOptions) ([]model.Pipeline, *gitlab.Response, error)
}

type GitlabClientImpl struct {
	client *gitlab.Client
}

func NewGitlabClient(client *gitlab.Client) GitlabClient {
	return &GitlabClientImpl{
		client,
	}
}

func (c *GitlabClientImpl) GetLatestPipeline(id model.ProjectId, options *gitlab.GetLatestPipelineOptions) (*model.Pipeline, *gitlab.Response, error) {
	pipeline, response, err := c.client.Pipelines.GetLatestPipeline(id, options)
	if err != nil {
		return util.HandleError[*model.Pipeline](nil, response, err)
	}

	p, err := util.Convert(pipeline, new(model.Pipeline))
	if err != nil {
		log.Panicf("unexpected JSON: %v", err)
	}

	return p, response, err
}

func (c *GitlabClientImpl) ListProjectPipelines(id model.ProjectId, options *gitlab.ListProjectPipelinesOptions) ([]model.Pipeline, *gitlab.Response, error) {
	pipelines, response, err := c.client.Pipelines.ListProjectPipelines(id, options)
	if err != nil {
		return util.HandleError(make([]model.Pipeline, 0), response, err)
	}

	p, err := util.Convert(pipelines, make([]model.Pipeline, 0))
	if err != nil {
		log.Panicf("unexpected JSON: %v", err)
	}

	return p, response, err
}
