package mock

import "github.com/larscom/gitlab-ci-dashboard/model"

type MockScheduleClient struct{}

func NewMockScheduleClient() *MockScheduleClient {
	return &MockScheduleClient{}
}

func (c *MockScheduleClient) GetPipelineSchedules(projectId int) []*model.Schedule {
	return []*model.Schedule{{Id: 777}}
}
