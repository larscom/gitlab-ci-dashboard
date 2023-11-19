package pipeline

import (
	"log"

	"github.com/larscom/gitlab-ci-dashboard/model"
	"github.com/larscom/gitlab-ci-dashboard/util"
	"github.com/xanzy/go-gitlab"
)

type GitlabClient interface {
	GetLatestPipeline(projectId int, opts *gitlab.GetLatestPipelineOptions) (*model.Pipeline, *gitlab.Response, error)

	ListProjectPipelines(projectId int, opts *gitlab.ListProjectPipelinesOptions) ([]model.Pipeline, *gitlab.Response, error)
}

type gitlabClient struct {
	gitlab *gitlab.Client
}

func NewGitlabClient(gitlab *gitlab.Client) GitlabClient {
	return &gitlabClient{
		gitlab: gitlab,
	}
}

func (c *gitlabClient) GetLatestPipeline(projectId int, options *gitlab.GetLatestPipelineOptions) (*model.Pipeline, *gitlab.Response, error) {
	pipeline, response, err := c.gitlab.Pipelines.GetLatestPipeline(projectId, options)
	if err != nil {
		return util.HandleError[*model.Pipeline](nil, response, err)
	}

	p, err := util.Convert(pipeline, new(model.Pipeline))
	if err != nil {
		log.Panicf("unexpected JSON: %v", err)
	}

	return p, response, err
}

func (c *gitlabClient) ListProjectPipelines(projectId int, options *gitlab.ListProjectPipelinesOptions) ([]model.Pipeline, *gitlab.Response, error) {
	pipelines, response, err := c.gitlab.Pipelines.ListProjectPipelines(projectId, options)
	if err != nil {
		return util.HandleError(make([]model.Pipeline, 0), response, err)
	}

	p, err := util.Convert(pipelines, make([]model.Pipeline, 0))
	if err != nil {
		log.Panicf("unexpected JSON: %v", err)
	}

	return p, response, err
}
