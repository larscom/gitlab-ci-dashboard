package mock

import "github.com/larscom/gitlab-ci-dashboard/model"

type ClientMock struct{}

func NewClientMock() *ClientMock {
	return &ClientMock{}
}

func (c *ClientMock) GetLatestPipeline(projectId int, ref string) (*model.Pipeline, error) {
	return &model.Pipeline{ProjectId: projectId, Ref: ref, Status: "success", Id: 1337}, nil
}

func (c *ClientMock) GetLatestPipelineBySource(projectId int, ref string, source string) (*model.Pipeline, error) {
	return &model.Pipeline{ProjectId: projectId, Ref: ref, Source: source, Status: "success", Id: 1337}, nil
}

func (c *ClientMock) GetPipelines(projectId int) ([]model.Pipeline, error) {
	return []model.Pipeline{
		{ProjectId: projectId, Status: "success", Id: 1},
		{ProjectId: projectId, Status: "failed", Id: 2},
	}, nil
}
