package mock

import "github.com/larscom/gitlab-ci-dashboard/model"

type ClientMock struct{}

func NewClientMock() *ClientMock {
	return &ClientMock{}
}

func (c *ClientMock) GetProjects(groupId int) ([]model.Project, error) {
	return []model.Project{{Name: "project-1"}}, nil
}
