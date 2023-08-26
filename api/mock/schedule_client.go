package mock

import "github.com/larscom/gitlab-ci-dashboard/model"

type ScheduleClient struct{}

func NewScheduleClient() *ScheduleClient {
	return &ScheduleClient{}
}

func (c *ScheduleClient) GetPipelineSchedules(projectId int) []model.Schedule {
	return []model.Schedule{{Id: 777}}
}
