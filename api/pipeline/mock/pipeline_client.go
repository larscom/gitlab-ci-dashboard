package mock

import "github.com/larscom/gitlab-ci-dashboard/data"

type ClientMock struct{}

func NewClientMock() *ClientMock {
	return &ClientMock{}
}

func (c *ClientMock) GetLatestPipeline(projectId int, ref string) (*data.Pipeline, error) {
	return &data.Pipeline{ProjectId: projectId, Ref: ref, Status: "success", Id: 1337}, nil
}

func (c *ClientMock) GetLatestPipelineBySource(projectId int, ref string, source string) (*data.Pipeline, error) {
	return &data.Pipeline{ProjectId: projectId, Ref: ref, Source: source, Status: "success", Id: 1337}, nil
}

func (c *ClientMock) GetPipelines(projectId int) []data.Pipeline {
	return []data.Pipeline{
		{ProjectId: projectId, Status: "success", Id: 1},
		{ProjectId: projectId, Status: "failed", Id: 2},
	}
}
