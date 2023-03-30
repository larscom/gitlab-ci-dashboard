package group

import (
	"log"

	"github.com/gofiber/fiber/v2"
	"github.com/larscom/gitlab-ci-dashboard/config"
	"github.com/larscom/gitlab-ci-dashboard/model"
	"github.com/larscom/gitlab-ci-dashboard/util"
	"github.com/xanzy/go-gitlab"
)

type GroupClient interface {
	GetGroups() []*model.Group
	GetGroupsById(ids []int) []*model.Group
}

type GroupClientImpl struct {
	client *gitlab.Client
	config *config.GitlabConfig
}

func NewGroupClient(client *gitlab.Client, config *config.GitlabConfig) GroupClient {
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
	groups, response, err := c.client.Groups.ListGroups(c.createOptions(1))
	if response.StatusCode == fiber.StatusUnauthorized {
		log.Panicln("unauhorized, invalid token?")
	}

	if err != nil {
		return make([]*model.Group, 0)
	}

	g, err := util.Convert(groups, make([]*model.Group, 0))
	if err != nil {
		log.Panicf("unexpected JSON: %v", err)
		return make([]*model.Group, 0)
	}

	if response.NextPage == 0 || response.TotalPages == 0 {
		return g
	}

	capacity := response.TotalPages - 1
	result := make(chan []*model.Group, capacity)

	for page := response.NextPage; page <= response.TotalPages; page++ {
		go c.getGroupsByPage(page, result)
	}

	for i := 0; i < capacity; i++ {
		g = append(g, <-result...)
	}

	close(result)

	return g
}

func (c *GroupClientImpl) getGroupsByPage(pageNumber int, result chan<- []*model.Group) {
	groups, _, err := c.client.Groups.ListGroups(c.createOptions(pageNumber))

	if err != nil {
		result <- make([]*model.Group, 0)
	} else {
		g, err := util.Convert(groups, make([]*model.Group, 0))
		if err != nil {
			log.Panicf("unexpected JSON: %v", err)
			result <- make([]*model.Group, 0)
		}
		result <- g
	}
}

func (c *GroupClientImpl) getGroupById(groupId int, result chan<- *model.Group) {
	group, _, err := c.client.Groups.GetGroup(groupId, &gitlab.GetGroupOptions{WithProjects: gitlab.Bool(false)})

	if err != nil {
		result <- nil
	} else {
		g, err := util.Convert(group, &model.Group{})
		if err != nil {
			log.Panicf("unexpected JSON: %v", err)
			result <- nil
		}
		result <- g
	}
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
