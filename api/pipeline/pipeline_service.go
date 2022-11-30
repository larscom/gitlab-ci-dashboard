package pipeline

import (
	"github.com/larscom/gitlab-ci-dashboard/model"
	"github.com/xanzy/go-gitlab"
)

type PipelineService struct {
	client *gitlab.Client
}

type PipelinePageProcessorResult struct {
	pipelines []*gitlab.PipelineInfo
	err       *model.Error
}

func NewPipelineService(client *gitlab.Client) *PipelineService {
	return &PipelineService{
		client: client,
	}
}

func (p *PipelineService) GetPipelines(projectId int, ref string) ([]*gitlab.PipelineInfo, *model.Error) {
	options := &gitlab.ListProjectPipelinesOptions{
		ListOptions: gitlab.ListOptions{
			Page:    1,
			PerPage: 10,
		},
		Ref: gitlab.String(ref),
	}

	pipelines, resp, err := p.client.Pipelines.ListProjectPipelines(projectId, options)
	if err != nil {
		return nil, model.NewError(resp.StatusCode, resp.Status)
	}

	return pipelines, nil
}
