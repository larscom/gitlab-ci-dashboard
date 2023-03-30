package group

import (
	"github.com/larscom/gitlab-ci-dashboard/client"
	"github.com/larscom/gitlab-ci-dashboard/config"
	"github.com/larscom/gitlab-ci-dashboard/model"
	"github.com/xanzy/go-gitlab"
)

type GroupClient interface {
	GetGroups() []*model.Group
	GetGroupsById(ids []int) []*model.Group
}

type GroupClientImpl struct {
	client client.GitlabClient
	config *config.GitlabConfig
}

func NewGroupClient(client client.GitlabClient, config *config.GitlabConfig) GroupClient {
	return &GroupClientImpl{client, config}
}

func (c *GroupClientImpl) GetGroupsById(ids []int) []*model.Group {
	result := make(chan *model.Group, len(ids))

	for _, groupId := range ids {
		go c.getGroupById(groupId, result)
	}

	groups := make([]*model.Group, 0)
	for range ids {
		group := <-result
		if group != nil {
			groups = append(groups, group)
		}
	}

	close(result)

	return groups
}

func (c *GroupClientImpl) GetGroups() []*model.Group {
	groups, response, err := c.client.ListGroups(c.createOptions(1))
	if err != nil {
		return groups
	}
	if response.NextPage == 0 || response.TotalPages == 0 {
		return groups
	}

	capacity := response.TotalPages - 1
	result := make(chan []*model.Group, capacity)

	for page := response.NextPage; page <= response.TotalPages; page++ {
		go c.getGroupsByPage(page, result)
	}

	for i := 0; i < capacity; i++ {
		groups = append(groups, <-result...)
	}

	close(result)

	return groups
}

func (c *GroupClientImpl) getGroupsByPage(pageNumber int, result chan<- []*model.Group) {
	groups, _, _ := c.client.ListGroups(c.createOptions(pageNumber))
	result <- groups
}

func (c *GroupClientImpl) getGroupById(groupId int, result chan<- *model.Group) {
	group, _, _ := c.client.GetGroup(groupId, &gitlab.GetGroupOptions{WithProjects: gitlab.Bool(false)})
	result <- group
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
