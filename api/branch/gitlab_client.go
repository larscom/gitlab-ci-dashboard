package branch

import (
	"github.com/larscom/gitlab-ci-dashboard/config"
	"github.com/larscom/gitlab-ci-dashboard/data"
	"github.com/larscom/gitlab-ci-dashboard/util"
	"github.com/xanzy/go-gitlab"
	"log"
)

type GitlabClient interface {
	ListBranches(projectId int, opts *gitlab.ListBranchesOptions) ([]data.Branch, *gitlab.Response, error)
}

type GitlabClientImpl struct {
	client *gitlab.Client
}

func NewGitlabClient(config *config.GitlabConfig) GitlabClient {
	client, err := gitlab.NewClient(config.GitlabToken, gitlab.WithBaseURL(config.GitlabUrl))
	if err != nil {
		log.Panicf("failed to create gitlab client: %v", err)
	}

	return &GitlabClientImpl{
		client,
	}
}

func (c *GitlabClientImpl) ListBranches(projectId int, options *gitlab.ListBranchesOptions) ([]data.Branch, *gitlab.Response, error) {
	branches, response, err := c.client.Branches.ListBranches(projectId, options)
	if err != nil {
		return util.HandleError(make([]data.Branch, 0), response, err)
	}

	b, err := util.Convert(branches, make([]data.Branch, 0))
	if err != nil {
		log.Panicf("unexpected JSON: %v", err)
	}

	return b, response, err
}
