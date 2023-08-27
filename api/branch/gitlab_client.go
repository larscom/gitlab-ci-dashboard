package branch

import (
	"github.com/larscom/gitlab-ci-dashboard/model"
	"github.com/larscom/gitlab-ci-dashboard/util"
	"github.com/xanzy/go-gitlab"
	"log"
)

type GitlabClient interface {
	ListBranches(projectId int, opts *gitlab.ListBranchesOptions) ([]model.Branch, *gitlab.Response, error)
}

type GitlabClientImpl struct {
	client *gitlab.Client
}

func NewGitlabClient(client *gitlab.Client) GitlabClient {
	return &GitlabClientImpl{
		client,
	}
}

func (c *GitlabClientImpl) ListBranches(projectId int, options *gitlab.ListBranchesOptions) ([]model.Branch, *gitlab.Response, error) {
	branches, response, err := c.client.Branches.ListBranches(projectId, options)
	if err != nil {
		return util.HandleError(make([]model.Branch, 0), response, err)
	}

	b, err := util.Convert(branches, make([]model.Branch, 0))
	if err != nil {
		log.Panicf("unexpected JSON: %v", err)
	}

	return b, response, err
}
