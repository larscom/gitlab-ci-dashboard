package project

import (
	"github.com/larscom/gitlab-ci-dashboard/client"
	"github.com/larscom/gitlab-ci-dashboard/model"
	"github.com/xanzy/go-gitlab"
)

type ProjectClient interface {
	GetProjects(groupId int) []*model.Project
}

type ProjectClientImpl struct {
	client client.GitlabClient
}

func NewProjectClient(client client.GitlabClient) ProjectClient {
	return &ProjectClientImpl{client}
}

func (c *ProjectClientImpl) GetProjects(groupId int) []*model.Project {
	projects, response, err := c.client.ListGroupProjects(groupId, c.createOptions(1))
	if err != nil {
		return projects
	}
	if response.NextPage == 0 || response.TotalPages <= 1 {
		return projects
	}

	capacity := response.TotalPages - 1
	chn := make(chan []*model.Project, capacity)

	for page := response.NextPage; page <= response.TotalPages; page++ {
		go c.getProjectsByPage(groupId, page, chn)
	}

	for i := 0; i < capacity; i++ {
		projects = append(projects, <-chn...)
	}

	close(chn)

	return projects
}

func (c *ProjectClientImpl) getProjectsByPage(groupId int, pageNumber int, chn chan<- []*model.Project) {
	projects, _, _ := c.client.ListGroupProjects(groupId, c.createOptions(pageNumber))
	chn <- projects
}

func (c *ProjectClientImpl) createOptions(pageNumber int) *gitlab.ListGroupProjectsOptions {
	return &gitlab.ListGroupProjectsOptions{
		ListOptions: gitlab.ListOptions{
			Page:    pageNumber,
			PerPage: 100,
		},
		Archived: gitlab.Bool(false),
	}
}
