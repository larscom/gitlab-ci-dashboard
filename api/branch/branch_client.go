package branch

import (
	"github.com/larscom/gitlab-ci-dashboard/data"
	"github.com/xanzy/go-gitlab"
	"sync"
)

type Client interface {
	GetBranches(projectId int) []data.Branch
}

type ClientImpl struct {
	client GitlabClient
}

func NewClient(client GitlabClient) Client {
	return &ClientImpl{
		client,
	}
}

func (c *ClientImpl) GetBranches(projectId int) []data.Branch {
	branches, response, err := c.client.ListBranches(projectId, createOptions(1))
	if err != nil {
		return branches
	}
	if response.NextPage == 0 || response.TotalPages <= 1 {
		return branches
	}

	chn := make(chan []data.Branch, response.TotalPages)

	var wg sync.WaitGroup
	for page := response.NextPage; page <= response.TotalPages; page++ {
		wg.Add(1)
		go c.getBranchesByPage(projectId, &wg, page, chn)
	}

	go func() {
		defer close(chn)
		wg.Wait()
	}()

	for value := range chn {
		branches = append(branches, value...)
	}

	return branches
}

func (c *ClientImpl) getBranchesByPage(projectId int, wg *sync.WaitGroup, pageNumber int, chn chan<- []data.Branch) {
	defer wg.Done()
	branches, _, _ := c.client.ListBranches(projectId, createOptions(pageNumber))
	chn <- branches
}

func createOptions(pageNumber int) *gitlab.ListBranchesOptions {
	return &gitlab.ListBranchesOptions{
		ListOptions: gitlab.ListOptions{
			Page:    pageNumber,
			PerPage: 100,
		},
	}
}
