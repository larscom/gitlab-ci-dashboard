package mock

import "github.com/larscom/gitlab-ci-dashboard/model"

type ProjectClient struct{}

func NewProjectClient() *ProjectClient {
	return &ProjectClient{}
}

func (c *ProjectClient) GetProjects(groupId int) []model.Project {
	return []model.Project{{Name: "project-1"}}
}
