package mock

import "github.com/larscom/gitlab-ci-dashboard/model"

type ScheduleServiceMock struct {
	Error error
}

func (s *ScheduleServiceMock) GetSchedules(id model.GroupId) ([]model.ScheduleWithProjectAndPipeline, error) {
	if id == 1 {
		return []model.ScheduleWithProjectAndPipeline{
			{
				Schedule: model.Schedule{
					Id: 123,
				},
			},
		}, s.Error
	}

	return make([]model.ScheduleWithProjectAndPipeline, 0), s.Error
}
