package branch

import (
	"sync"

	"github.com/larscom/gitlab-ci-dashboard/client"
	"github.com/larscom/gitlab-ci-dashboard/model"
	"github.com/xanzy/go-gitlab"
)

type BranchClient interface {
	GetBranches(projectId int) []model.Branch
}

type BranchClientImpl struct {
	client client.GitlabClient
}

func NewBranchClient(client client.GitlabClient) BranchClient {
	return &BranchClientImpl{
		client,
	}
}

func (c *BranchClientImpl) GetBranches(projectId int) []model.Branch {
	branches, response, err := c.client.ListBranches(projectId, createOptions(1))
	if err != nil {
		return branches
	}
	if response.NextPage == 0 || response.TotalPages <= 1 {
		return branches
	}

	chn := make(chan []model.Branch, response.TotalPages)

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

func (c *BranchClientImpl) getBranchesByPage(projectId int, wg *sync.WaitGroup, pageNumber int, chn chan<- []model.Branch) {
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
