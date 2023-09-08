package mock

import "github.com/larscom/gitlab-ci-dashboard/model"

type ClientMock struct{}

func (c *ClientMock) GetPipelineSchedules(id model.ProjectId) ([]model.Schedule, error) {
	return []model.Schedule{{Id: 777}}, nil
}
