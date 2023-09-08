package project

import (
	"github.com/larscom/gitlab-ci-dashboard/model"
	"github.com/larscom/gitlab-ci-dashboard/util"
	"github.com/xanzy/go-gitlab"
	"golang.org/x/net/context"
	"golang.org/x/sync/errgroup"
)

type Client interface {
	GetProjects(model.GroupId) ([]model.Project, error)
}

type ClientImpl struct {
	client GitlabClient
}

func NewClient(client GitlabClient) Client {
	return &ClientImpl{
		client,
	}
}

func (c *ClientImpl) GetProjects(id model.GroupId) ([]model.Project, error) {
	projects, response, err := c.client.ListGroupProjects(id, createOptions(1))
	if err != nil {
		return projects, err
	}
	if response.NextPage == 0 || response.TotalPages <= 1 {
		return projects, nil
	}

	var (
		resultchn = make(chan []model.Project, util.GetMaxChanCapacity(response.TotalPages))
		g, ctx    = errgroup.WithContext(context.Background())
	)

	for page := response.NextPage; page <= response.TotalPages; page++ {
		run := util.CreateRunFunc[projectPageArgs, []model.Project](c.getProjectsByPage, resultchn, ctx)
		g.Go(run(projectPageArgs{
			groupId:    id,
			pageNumber: page,
		}))
	}

	go func() {
		defer close(resultchn)
		g.Wait()
	}()

	for value := range resultchn {
		projects = append(projects, value...)
	}

	return projects, g.Wait()
}

type projectPageArgs struct {
	groupId    model.GroupId
	pageNumber int
}

func (c *ClientImpl) getProjectsByPage(args projectPageArgs) ([]model.Project, error) {
	projects, _, err := c.client.ListGroupProjects(args.groupId, createOptions(args.pageNumber))
	return projects, err
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
