package pipeline

import (
	"fmt"

	"github.com/rs/zerolog"
	"github.com/xanzy/go-gitlab"
)

type PipelineService struct {
	client *gitlab.Client
	logger zerolog.Logger
}

func NewPipelineService(client *gitlab.Client, logger zerolog.Logger) *PipelineService {
	return &PipelineService{
		client: client,
		logger: logger,
	}
}

func (p *PipelineService) GetPipelines(projectId int, ref string) []*gitlab.PipelineInfo {
	options := &gitlab.ListProjectPipelinesOptions{
		ListOptions: gitlab.ListOptions{
			Page:    1,
			PerPage: 5,
		},
		Ref: &ref,
	}

	pipelines, resp, err := p.client.Pipelines.ListProjectPipelines(projectId, options)
	if err != nil {
		p.logger.
			Warn().
			Int("status", resp.StatusCode).
			Err(err).
			Msg(fmt.Sprintf("Error while retrieving pipelines for projectId: %d and ref: %s", projectId, ref))
		return make([]*gitlab.PipelineInfo, 0)
	}

	return pipelines
}
