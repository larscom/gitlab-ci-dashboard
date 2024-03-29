package branch

import (
	"log/slog"

	"github.com/larscom/gitlab-ci-dashboard/model"
	"github.com/larscom/gitlab-ci-dashboard/util"
	"github.com/xanzy/go-gitlab"
)

type GitlabClient interface {
	ListBranches(projectId int, opts *gitlab.ListBranchesOptions) ([]model.Branch, *gitlab.Response, error)
}

type gitlabClient struct {
	gitlab *gitlab.Client
}

func NewGitlabClient(gitlab *gitlab.Client) GitlabClient {
	return &gitlabClient{
		gitlab: gitlab,
	}
}

func (c *gitlabClient) ListBranches(projectId int, options *gitlab.ListBranchesOptions) ([]model.Branch, *gitlab.Response, error) {
	slog.Debug("fetching all branches for project from gitlab API", "project_id", projectId)
	branches, response, err := c.gitlab.Branches.ListBranches(projectId, options)
	if err != nil {
		return util.HandleError(make([]model.Branch, 0), response, err)
	}

	b, err := util.Convert(branches, make([]model.Branch, 0))
	if err != nil {
		slog.Error("unexpected JSON", "error", err.Error())
	}

	return b, response, err
}
