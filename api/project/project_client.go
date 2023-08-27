package project

import (
	"github.com/larscom/gitlab-ci-dashboard/model"
	"sync"

	"github.com/xanzy/go-gitlab"
)

type Client interface {
	GetProjects(groupId int) ([]model.Project, error)
}

type ClientImpl struct {
	client GitlabClient
}

func NewClient(client GitlabClient) Client {
	return &ClientImpl{
		client,
	}
}

func (c *ClientImpl) GetProjects(groupId int) ([]model.Project, error) {
	projects, response, err := c.client.ListGroupProjects(groupId, createOptions(1))
	if err != nil {
		return projects, err
	}
	if response.NextPage == 0 || response.TotalPages <= 1 {
		return projects, nil
	}
	var (
		chn    = make(chan []model.Project, response.TotalPages)
		errchn = make(chan error)
		wg     sync.WaitGroup
	)

	for page := response.NextPage; page <= response.TotalPages; page++ {
		wg.Add(1)
		go c.getProjectsByPage(groupId, &wg, page, chn, errchn)
	}

	go func() {
		defer close(errchn)
		defer close(chn)
		wg.Wait()
	}()

	if e := <-errchn; e != nil {
		return projects, e
	}

	for value := range chn {
		projects = append(projects, value...)
	}

	return projects, nil
}

func (c *ClientImpl) getProjectsByPage(
	groupId int,
	wg *sync.WaitGroup,
	pageNumber int,
	chn chan<- []model.Project,
	errchn chan<- error,
) {
	defer wg.Done()

	projects, _, err := c.client.ListGroupProjects(groupId, createOptions(pageNumber))
	if err != nil {
		errchn <- err
	} else {
		chn <- projects
	}
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
