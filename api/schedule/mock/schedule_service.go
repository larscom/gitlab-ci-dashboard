package mock

import (
	"context"

	"github.com/larscom/gitlab-ci-dashboard/model"
)

type ScheduleServiceMock struct {
	Error error
}

func (s *ScheduleServiceMock) GetSchedules(groupId int, ctx context.Context) ([]model.ScheduleProjectLatestPipeline, error) {
	if groupId == 1 {
		return []model.ScheduleProjectLatestPipeline{
			{
				Schedule: model.Schedule{
					Id: 123,
				},
			},
		}, s.Error
	}

	return make([]model.ScheduleProjectLatestPipeline, 0), s.Error
}
