package pipeline

import (
	"log"

	"github.com/gofiber/fiber/v2"
	"github.com/larscom/gitlab-ci-dashboard/model"
	"github.com/larscom/gitlab-ci-dashboard/util"
	"github.com/xanzy/go-gitlab"
)

type PipelineClient interface {
	GetLatestPipeline(projectId int, ref string) (*model.Pipeline, error)
}

type PipelineClientImpl struct {
	client *gitlab.Client
}

func NewPipelineClient(client *gitlab.Client) PipelineClient {
	return &PipelineClientImpl{client}
}

func (c *PipelineClientImpl) GetLatestPipeline(projectId int, ref string) (*model.Pipeline, error) {
	pipeline, response, err := c.client.Pipelines.GetLatestPipeline(projectId, &gitlab.GetLatestPipelineOptions{
		Ref: &ref,
	})
	if response.StatusCode == fiber.StatusUnauthorized {
		log.Panicln("unauhorized, invalid token?")
	}

	if err != nil {
		return nil, err
	}

	p, err := util.Convert(pipeline, &model.Pipeline{})
	if err != nil {
		log.Panicf("unexpected JSON: %v", err)
		return nil, err
	}

	return p, nil
}
