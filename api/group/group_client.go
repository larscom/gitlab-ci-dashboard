package group

import (
	"github.com/larscom/gitlab-ci-dashboard/config"
	"github.com/larscom/gitlab-ci-dashboard/model"
	"github.com/larscom/gitlab-ci-dashboard/util"
	"golang.org/x/net/context"
	"golang.org/x/sync/errgroup"

	"github.com/xanzy/go-gitlab"
)

type GroupClient interface {
	GetGroups(ctx context.Context) ([]model.Group, error)

	GetGroupsById(ids []int, ctx context.Context) ([]model.Group, error)
}

type groupClient struct {
	gitlab GitlabClient
	config *config.GitlabConfig
}

func NewClient(gitlab GitlabClient, config *config.GitlabConfig) GroupClient {
	return &groupClient{
		gitlab: gitlab,
		config: config,
	}
}

func (c *groupClient) GetGroupsById(ids []int, ctx context.Context) ([]model.Group, error) {
	var (
		resultchn = make(chan *model.Group, util.GetMaxChanCapacity(len(ids)))
		g, gctx   = errgroup.WithContext(ctx)
		results   = make([]model.Group, 0)
	)

	for _, groupId := range ids {
		run := util.CreateRunFunc(c.getGroupById, resultchn, gctx)
		g.Go(run(groupId))
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

func (c *groupClient) GetGroups(ctx context.Context) ([]model.Group, error) {
	groups, response, err := c.gitlab.ListGroups(c.createOptions(1))
	if err != nil {
		return groups, err
	}
	if response.NextPage == 0 || response.TotalPages <= 1 {
		return groups, nil
	}

	var (
		resultchn = make(chan []model.Group, util.GetMaxChanCapacity(response.TotalPages))
		g, gctx   = errgroup.WithContext(ctx)
	)

	for page := response.NextPage; page <= response.TotalPages; page++ {
		run := util.CreateRunFunc(c.getGroupsByPage, resultchn, gctx)
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

func (c *groupClient) getGroupsByPage(pageNumber int) ([]model.Group, error) {
	groups, _, err := c.gitlab.ListGroups(c.createOptions(pageNumber))
	return groups, err
}

func (c *groupClient) getGroupById(groupId int) (*model.Group, error) {
	group, _, err := c.gitlab.GetGroup(groupId, &gitlab.GetGroupOptions{WithProjects: gitlab.Ptr(false)})
	return group, err
}

func (c *groupClient) createOptions(pageNumber int) *gitlab.ListGroupsOptions {
	return &gitlab.ListGroupsOptions{
		ListOptions: gitlab.ListOptions{
			Page:    pageNumber,
			PerPage: 100,
		},
		SkipGroups:   &c.config.GroupSkipIds,
		TopLevelOnly: &c.config.GroupOnlyTopLevel,
	}
}
