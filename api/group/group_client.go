package group

import (
	"github.com/larscom/gitlab-ci-dashboard/config"
	"github.com/larscom/gitlab-ci-dashboard/model"
	"github.com/larscom/gitlab-ci-dashboard/util"
	"golang.org/x/net/context"
	"golang.org/x/sync/errgroup"

	"github.com/xanzy/go-gitlab"
)

type Client interface {
	GetGroups() ([]model.Group, error)

	GetGroupsById([]int) ([]model.Group, error)
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

func (c *ClientImpl) GetGroupsById(ids []int) ([]model.Group, error) {
	var (
		resultchn = make(chan *model.Group, util.GetMaxChanCapacity(len(ids)))
		g, ctx    = errgroup.WithContext(context.Background())
		results   = make([]model.Group, 0)
	)

	for _, groupId := range ids {
		run := util.CreateRunFunc[model.GroupId, *model.Group](c.getGroupById, resultchn, ctx)
		g.Go(run(model.GroupId(groupId)))
	}

	go func() {
		defer close(resultchn)
		g.Wait()
	}()

	for value := range resultchn {
		if value != nil {
			results = append(results, *value)
		}
	}

	return results, g.Wait()
}

func (c *ClientImpl) GetGroups() ([]model.Group, error) {
	groups, response, err := c.client.ListGroups(c.createOptions(1))
	if err != nil {
		return groups, err
	}
	if response.NextPage == 0 || response.TotalPages <= 1 {
		return groups, nil
	}

	var (
		resultchn = make(chan []model.Group, util.GetMaxChanCapacity(response.TotalPages))
		g, ctx    = errgroup.WithContext(context.Background())
	)

	for page := response.NextPage; page <= response.TotalPages; page++ {
		run := util.CreateRunFunc[int, []model.Group](c.getGroupsByPage, resultchn, ctx)
		g.Go(run(page))
	}

	go func() {
		defer close(resultchn)
		g.Wait()
	}()

	for value := range resultchn {
		groups = append(groups, value...)
	}

	return groups, g.Wait()
}

func (c *ClientImpl) getGroupsByPage(pageNumber int) ([]model.Group, error) {
	groups, _, err := c.client.ListGroups(c.createOptions(pageNumber))
	return groups, err
}

func (c *ClientImpl) getGroupById(id model.GroupId) (*model.Group, error) {
	group, _, err := c.client.GetGroup(id, &gitlab.GetGroupOptions{WithProjects: gitlab.Bool(false)})
	return group, err
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
