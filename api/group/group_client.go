package group

import (
	"github.com/larscom/gitlab-ci-dashboard/data"
	"sync"

	"github.com/larscom/gitlab-ci-dashboard/config"

	"github.com/xanzy/go-gitlab"
)

type Client interface {
	GetGroups() []data.Group

	GetGroupsById(ids []int) []data.Group
}

type ClientImpl struct {
	client GitlabClient
	config *config.GitlabConfig
}

func NewClient(client GitlabClient, config *config.GitlabConfig) Client {
	return &ClientImpl{
		client,
		config,
	}
}

func (c *ClientImpl) GetGroupsById(ids []int) []data.Group {
	chn := make(chan *data.Group, len(ids))

	for _, groupId := range ids {
		go c.getGroupById(groupId, chn)
	}

	groups := make([]data.Group, 0)
	for range ids {
		group := <-chn
		if group != nil {
			groups = append(groups, *group)
		}
	}

	close(chn)

	return groups
}

func (c *ClientImpl) GetGroups() []data.Group {
	groups, response, err := c.client.ListGroups(c.createOptions(1))
	if err != nil {
		return groups
	}
	if response.NextPage == 0 || response.TotalPages <= 1 {
		return groups
	}

	chn := make(chan []data.Group, response.TotalPages)

	var wg sync.WaitGroup
	for page := response.NextPage; page <= response.TotalPages; page++ {
		wg.Add(1)
		go c.getGroupsByPage(page, &wg, chn)
	}

	go func() {
		defer close(chn)
		wg.Wait()
	}()

	for value := range chn {
		groups = append(groups, value...)
	}

	return groups
}

func (c *ClientImpl) getGroupsByPage(pageNumber int, wg *sync.WaitGroup, chn chan<- []data.Group) {
	defer wg.Done()
	groups, _, _ := c.client.ListGroups(c.createOptions(pageNumber))
	chn <- groups
}

func (c *ClientImpl) getGroupById(groupId int, chn chan<- *data.Group) {
	group, _, _ := c.client.GetGroup(groupId, &gitlab.GetGroupOptions{WithProjects: gitlab.Bool(false)})
	chn <- group
}

func (c *ClientImpl) createOptions(pageNumber int) *gitlab.ListGroupsOptions {
	return &gitlab.ListGroupsOptions{
		ListOptions: gitlab.ListOptions{
			Page:    pageNumber,
			PerPage: 100,
		},
		SkipGroups:   &c.config.GroupSkipIds,
		TopLevelOnly: &c.config.GroupOnlyTopLevel,
	}
}
