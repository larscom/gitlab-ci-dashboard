package pipeline

import (
	"fmt"

	"github.com/larscom/gitlab-ci-dashboard/client"
	"github.com/larscom/gitlab-ci-dashboard/model"
	"github.com/xanzy/go-gitlab"
)

type PipelineClient interface {
	GetLatestPipeline(projectId int, ref string) (*model.Pipeline, error)
	GetLatestPipelineBySource(projectId int, ref string, source string) (*model.Pipeline, error)
}

type PipelineClientImpl struct {
	client client.GitlabClient
}

func NewPipelineClient(client client.GitlabClient) PipelineClient {
	return &PipelineClientImpl{
		client,
	}
}

func (c *PipelineClientImpl) GetLatestPipeline(projectId int, ref string) (*model.Pipeline, error) {
	options := &gitlab.GetLatestPipelineOptions{Ref: &ref}
	pipeline, _, err := c.client.GetLatestPipeline(projectId, options)
	return pipeline, err
}

func (c *PipelineClientImpl) GetLatestPipelineBySource(projectId int, ref string, source string) (*model.Pipeline, error) {
	options := &gitlab.ListProjectPipelinesOptions{
		Ref:    &ref,
		Source: &source,
		ListOptions: gitlab.ListOptions{
			Page:    1,
			PerPage: 1,
		},
	}

	pipelines, _, err := c.client.ListProjectPipelines(projectId, options)
	if err != nil {
		return nil, err
	}

	if len(pipelines) > 0 {
		return pipelines[0], nil
	}

	return nil, fmt.Errorf("no pipelines found for project: %d and branch: %s", projectId, ref)
}
