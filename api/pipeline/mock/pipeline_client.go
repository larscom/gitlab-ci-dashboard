package mock

import "github.com/larscom/gitlab-ci-dashboard/model"

type ClientMock struct{}

func (c *ClientMock) GetLatestPipeline(id model.ProjectId, ref string) (*model.Pipeline, error) {
	return &model.Pipeline{ProjectId: id, Ref: ref, Status: "success", Id: 1337}, nil
}

func (c *ClientMock) GetLatestPipelineBySource(id model.ProjectId, ref string, source string) (*model.Pipeline, error) {
	return &model.Pipeline{ProjectId: id, Ref: ref, Source: source, Status: "success", Id: 1337}, nil
}

func (c *ClientMock) GetPipelines(id model.ProjectId) ([]model.Pipeline, error) {
	return []model.Pipeline{
		{ProjectId: id, Status: "success", Id: 1},
		{ProjectId: id, Status: "failed", Id: 2},
	}, nil
}
