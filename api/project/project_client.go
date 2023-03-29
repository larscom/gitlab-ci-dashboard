package project

import (
	"log"

	"github.com/larscom/gitlab-ci-dashboard/model"
	"github.com/larscom/gitlab-ci-dashboard/util"
	"github.com/xanzy/go-gitlab"
)

type ProjectClient interface {
	GetProjects(groupId int) []*model.Project
}

type ProjectClientImpl struct {
	client *gitlab.Client
}

func NewProjectClient(client *gitlab.Client) ProjectClient {
	return &ProjectClientImpl{client}
}

func (c *ProjectClientImpl) GetProjects(groupId int) []*model.Project {
	projects, response, err := c.client.Groups.ListGroupProjects(groupId, c.createOptions(1))
	if err != nil {
		return make([]*model.Project, 0)
	}

	p, err := util.Convert(projects, make([]*model.Project, 0))
	if err != nil {
		log.Panicf("unexpected JSON: %v", err)
		return make([]*model.Project, 0)
	}

	if response.NextPage == 0 || response.TotalPages == 0 {
		return p
	}

	capacity := response.TotalPages - 1
	result := make(chan []*model.Project, capacity)

	for page := response.NextPage; page <= response.TotalPages; page++ {
		go c.getProjectsByPage(groupId, page, result)
	}

	for i := 0; i < capacity; i++ {
		p = append(p, <-result...)
	}

	close(result)

	return p
}

func (c *ProjectClientImpl) getProjectsByPage(groupId int, pageNumber int, result chan<- []*model.Project) {
	projects, _, err := c.client.Groups.ListGroupProjects(groupId, c.createOptions(pageNumber))

	if err != nil {
		result <- make([]*model.Project, 0)
	} else {
		p, err := util.Convert(projects, make([]*model.Project, 0))
		if err != nil {
			log.Panicf("unexpected JSON: %v", err)
			result <- make([]*model.Project, 0)
		}
		result <- p
	}
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
