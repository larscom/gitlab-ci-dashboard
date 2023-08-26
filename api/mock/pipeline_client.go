package mock

import "github.com/larscom/gitlab-ci-dashboard/model"

type PipelineClient struct{}

func NewPipelineClient() *PipelineClient {
	return &PipelineClient{}
}

func (c *PipelineClient) GetLatestPipeline(projectId int, ref string) (*model.Pipeline, error) {
	return &model.Pipeline{ProjectId: projectId, Ref: ref, Status: "success", Id: 1337}, nil
}

func (c *PipelineClient) GetLatestPipelineBySource(projectId int, ref string, source string) (*model.Pipeline, error) {
	return &model.Pipeline{ProjectId: projectId, Ref: ref, Source: source, Status: "success", Id: 1337}, nil
}

func (c *PipelineClient) GetPipelines(projectId int) []model.Pipeline {
	return []model.Pipeline{
		{ProjectId: projectId, Status: "success", Id: 1},
		{ProjectId: projectId, Status: "failed", Id: 2},
	}
}
