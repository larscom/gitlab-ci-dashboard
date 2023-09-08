package branch

import (
	"github.com/larscom/gitlab-ci-dashboard/model"
	"github.com/larscom/gitlab-ci-dashboard/util"
	"github.com/xanzy/go-gitlab"
	"golang.org/x/net/context"
	"golang.org/x/sync/errgroup"
)

type Client interface {
	GetBranches(projectId int) ([]model.Branch, error)
}

type ClientImpl struct {
	client GitlabClient
}

func NewClient(client GitlabClient) Client {
	return &ClientImpl{
		client,
	}
}

func (c *ClientImpl) GetBranches(projectId int) ([]model.Branch, error) {
	branches, response, err := c.client.ListBranches(projectId, createOptions(1))
	if err != nil {
		return branches, err
	}
	if response.NextPage == 0 || response.TotalPages <= 1 {
		return branches, nil
	}

	var (
		resultchn = make(chan []model.Branch, util.GetMaxChanCapacity(response.TotalPages))
		g, ctx    = errgroup.WithContext(context.Background())
	)

	for page := response.NextPage; page <= response.TotalPages; page++ {
		run := util.CreateRunFunc[branchPageArgs, []model.Branch](c.getBranchesByPage, resultchn, ctx)
		g.Go(run(branchPageArgs{
			projectId:  projectId,
			pageNumber: page,
		}))
	}

	go func() {
		defer close(resultchn)
		g.Wait()
	}()

	for value := range resultchn {
		branches = append(branches, value...)
	}

	return branches, g.Wait()
}

type branchPageArgs struct {
	projectId  int
	pageNumber int
}

func (c *ClientImpl) getBranchesByPage(args branchPageArgs) ([]model.Branch, error) {
	branches, _, err := c.client.ListBranches(args.projectId, createOptions(args.pageNumber))
	return branches, err
}

func createOptions(pageNumber int) *gitlab.ListBranchesOptions {
	return &gitlab.ListBranchesOptions{
		ListOptions: gitlab.ListOptions{
			Page:    pageNumber,
			PerPage: 100,
		},
	}
}
