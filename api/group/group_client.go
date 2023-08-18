package group

import (
	"sync"

	"github.com/larscom/gitlab-ci-dashboard/client"
	"github.com/larscom/gitlab-ci-dashboard/config"
	"github.com/larscom/gitlab-ci-dashboard/model"
	"github.com/xanzy/go-gitlab"
)

type GroupClient interface {
	GetGroups() []model.Group
	GetGroupsById(ids []int) []model.Group
}

type GroupClientImpl struct {
	client client.GitlabClient
	config *config.GitlabConfig
}

func NewGroupClient(client client.GitlabClient, config *config.GitlabConfig) GroupClient {
	return &GroupClientImpl{
		client,
		config,
	}
}

func (c *GroupClientImpl) GetGroupsById(ids []int) []model.Group {
	chn := make(chan *model.Group, len(ids))

	for _, groupId := range ids {
		go c.getGroupById(groupId, chn)
	}

	groups := make([]model.Group, 0)
	for range ids {
		group := <-chn
		if group != nil {
			groups = append(groups, *group)
		}
	}

	close(chn)

	return groups
}

func (c *GroupClientImpl) GetGroups() []model.Group {
	groups, response, err := c.client.ListGroups(c.createOptions(1))
	if err != nil {
		return groups
	}
	if response.NextPage == 0 || response.TotalPages <= 1 {
		return groups
	}

	chn := make(chan []model.Group, response.TotalPages)

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

func (c *GroupClientImpl) getGroupsByPage(pageNumber int, wg *sync.WaitGroup, chn chan<- []model.Group) {
	defer wg.Done()
	groups, _, _ := c.client.ListGroups(c.createOptions(pageNumber))
	chn <- groups
}

func (c *GroupClientImpl) getGroupById(groupId int, chn chan<- *model.Group) {
	group, _, _ := c.client.GetGroup(groupId, &gitlab.GetGroupOptions{WithProjects: gitlab.Bool(false)})
	chn <- group
}

func (c *GroupClientImpl) createOptions(pageNumber int) *gitlab.ListGroupsOptions {
	return &gitlab.ListGroupsOptions{
		ListOptions: gitlab.ListOptions{
			Page:    pageNumber,
			PerPage: 100,
		},
		SkipGroups:   &c.config.GroupSkipIds,
		TopLevelOnly: &c.config.GroupOnlyTopLevel,
	}
}
