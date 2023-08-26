package mock

import "github.com/larscom/gitlab-ci-dashboard/data"

type ClientMock struct{}

func NewClientMock() *ClientMock {
	return &ClientMock{}
}

func (c *ClientMock) GetProjects(groupId int) []data.Project {
	return []data.Project{{Name: "project-1"}}
}
