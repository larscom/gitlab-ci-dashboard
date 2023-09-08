package mock

import "github.com/larscom/gitlab-ci-dashboard/model"

type ClientMock struct{}

func (c *ClientMock) GetPipelineSchedules(projectId int) ([]model.Schedule, error) {
	return []model.Schedule{{Id: 777}}, nil
}
