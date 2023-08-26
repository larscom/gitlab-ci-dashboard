package mock

import "github.com/larscom/gitlab-ci-dashboard/data"

type ClientMock struct{}

func NewClientMock() *ClientMock {
	return &ClientMock{}
}

func (c *ClientMock) GetPipelineSchedules(projectId int) []data.Schedule {
	return []data.Schedule{{Id: 777}}
}
