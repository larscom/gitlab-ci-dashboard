package branch

import (
	"log"

	"github.com/gofiber/fiber/v2"
	"github.com/larscom/gitlab-ci-dashboard/model"
	"github.com/larscom/gitlab-ci-dashboard/util"
	"github.com/xanzy/go-gitlab"
)

type BranchClient interface {
	GetBranches(projectId int) []*model.Branch
}

type BranchClientImpl struct {
	client *gitlab.Client
}

func NewBranchClient(client *gitlab.Client) BranchClient {
	return &BranchClientImpl{client}
}

func (c *BranchClientImpl) GetBranches(projectId int) []*model.Branch {
	branches, response, err := c.client.Branches.ListBranches(projectId, c.createOptions(1))
	if response.StatusCode == fiber.StatusUnauthorized {
		log.Panicln("unauhorized, invalid token?")
	}

	if err != nil {
		return make([]*model.Branch, 0)
	}

	b, err := util.Convert(branches, make([]*model.Branch, 0))
	if err != nil {
		log.Panicf("unexpected JSON: %v", err)
		return make([]*model.Branch, 0)
	}

	if response.NextPage == 0 || response.TotalPages == 0 {
		return b
	}

	capacity := response.TotalPages - 1
	result := make(chan []*model.Branch, capacity)

	for page := response.NextPage; page <= response.TotalPages; page++ {
		go c.getBranchesByPage(projectId, page, result)
	}

	for i := 0; i < capacity; i++ {
		b = append(b, <-result...)
	}

	close(result)

	return b
}

func (c *BranchClientImpl) getBranchesByPage(projectId int, pageNumber int, result chan<- []*model.Branch) {
	branches, _, err := c.client.Branches.ListBranches(projectId, c.createOptions(pageNumber))

	if err != nil {
		result <- make([]*model.Branch, 0)
	} else {
		p, err := util.Convert(branches, make([]*model.Branch, 0))
		if err != nil {
			log.Panicf("unexpected JSON: %v", err)
			result <- make([]*model.Branch, 0)
		}
		result <- p
	}
}

func (c *BranchClientImpl) createOptions(pageNumber int) *gitlab.ListBranchesOptions {
	return &gitlab.ListBranchesOptions{
		ListOptions: gitlab.ListOptions{
			Page:    pageNumber,
			PerPage: 100,
		},
	}
}
