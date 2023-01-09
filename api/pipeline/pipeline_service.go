package pipeline

import (
	"fmt"

	"github.com/rs/zerolog"
	"github.com/xanzy/go-gitlab"
)

type IPipelineService interface {
	GetPipelines(projectId int, ref string) []*gitlab.PipelineInfo
}

type PipelineService struct {
	GitlabClient *gitlab.Client
	Logger       zerolog.Logger
}

func NewPipelineService(client *gitlab.Client, logger zerolog.Logger) *PipelineService {
	return &PipelineService{
		GitlabClient: client,
		Logger:       logger,
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

	pipelines, resp, err := p.GitlabClient.Pipelines.ListProjectPipelines(projectId, options)
	if err != nil {
		p.Logger.
			Warn().
			Int("status", resp.StatusCode).
			Err(err).
			Msg(fmt.Sprintf("Error while retrieving pipelines for projectId: %d and ref: %s", projectId, ref))
		return make([]*gitlab.PipelineInfo, 0)
	}

	return pipelines
}
