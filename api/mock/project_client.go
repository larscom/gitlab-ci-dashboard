package mock

import "github.com/larscom/gitlab-ci-dashboard/model"

type MockProjectClient struct{}

func NewMockProjectClient() *MockProjectClient {
	return &MockProjectClient{}
}

func (c *MockProjectClient) GetProjects(groupId int) []*model.Project {
	return []*model.Project{{Name: "project-1"}}
}
