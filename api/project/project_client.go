package project

import (
	"sync"

	"github.com/larscom/gitlab-ci-dashboard/client"
	"github.com/larscom/gitlab-ci-dashboard/model"
	"github.com/xanzy/go-gitlab"
)

type Client interface {
	GetProjects(groupId int) []model.Project
}

type ClientImpl struct {
	client client.GitlabClient
}

func NewClient(client client.GitlabClient) Client {
	return &ClientImpl{
		client,
	}
}

func (c *ClientImpl) GetProjects(groupId int) []model.Project {
	projects, response, err := c.client.ListGroupProjects(groupId, createOptions(1))
	if err != nil {
		return projects
	}
	if response.NextPage == 0 || response.TotalPages <= 1 {
		return projects
	}

	chn := make(chan []model.Project, response.TotalPages)

	var wg sync.WaitGroup
	for page := response.NextPage; page <= response.TotalPages; page++ {
		wg.Add(1)
		go c.getProjectsByPage(groupId, &wg, page, chn)
	}

	go func() {
		defer close(chn)
		wg.Wait()
	}()

	for value := range chn {
		projects = append(projects, value...)
	}

	return projects
}

func (c *ClientImpl) getProjectsByPage(groupId int, wg *sync.WaitGroup, pageNumber int, chn chan<- []model.Project) {
	defer wg.Done()
	projects, _, _ := c.client.ListGroupProjects(groupId, createOptions(pageNumber))
	chn <- projects
}

func createOptions(pageNumber int) *gitlab.ListGroupProjectsOptions {
	return &gitlab.ListGroupProjectsOptions{
		ListOptions: gitlab.ListOptions{
			Page:    pageNumber,
			PerPage: 100,
		},
		Archived: gitlab.Bool(false),
	}
}
