package mock

import "github.com/larscom/gitlab-ci-dashboard/model"

type ClientMock struct{}

func (c *ClientMock) GetProjects(id model.GroupId) ([]model.Project, error) {
	return []model.Project{{Name: "project-1"}}, nil
}
