package mock

import "github.com/larscom/gitlab-ci-dashboard/model"

type ClientMock struct{}

func NewClientMock() *ClientMock {
	return &ClientMock{}
}

func (c *ClientMock) GetPipelineSchedules(projectId int) []model.Schedule {
	return []model.Schedule{{Id: 777}}
}
