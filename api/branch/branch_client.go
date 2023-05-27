package branch

import (
	"github.com/larscom/gitlab-ci-dashboard/client"
	"github.com/larscom/gitlab-ci-dashboard/model"
	"github.com/xanzy/go-gitlab"
)

type BranchClient interface {
	GetBranches(projectId int) []*model.Branch
}

type BranchClientImpl struct {
	client client.GitlabClient
}

func NewBranchClient(client client.GitlabClient) BranchClient {
	return &BranchClientImpl{
		client,
	}
}

func (c *BranchClientImpl) GetBranches(projectId int) []*model.Branch {
	branches, response, err := c.client.ListBranches(projectId, c.createOptions(1))
	if err != nil {
		return branches
	}
	if response.NextPage == 0 || response.TotalPages <= 1 {
		return branches
	}

	capacity := response.TotalPages - 1
	chn := make(chan []*model.Branch, capacity)

	for page := response.NextPage; page <= response.TotalPages; page++ {
		go c.getBranchesByPage(projectId, page, chn)
	}

	for i := 0; i < capacity; i++ {
		branches = append(branches, <-chn...)
	}

	close(chn)

	return branches
}

func (c *BranchClientImpl) getBranchesByPage(projectId int, pageNumber int, chn chan<- []*model.Branch) {
	branches, _, _ := c.client.ListBranches(projectId, c.createOptions(pageNumber))
	chn <- branches
}

func (c *BranchClientImpl) createOptions(pageNumber int) *gitlab.ListBranchesOptions {
	return &gitlab.ListBranchesOptions{
		ListOptions: gitlab.ListOptions{
			Page:    pageNumber,
			PerPage: 100,
		},
	}
}
