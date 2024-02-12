package project

import (
	"log/slog"

	"github.com/larscom/gitlab-ci-dashboard/model"
	"github.com/larscom/gitlab-ci-dashboard/util"
	"github.com/xanzy/go-gitlab"
)

type GitlabClient interface {
	ListGroupProjects(groupId int, opts *gitlab.ListGroupProjectsOptions) ([]model.Project, *gitlab.Response, error)
}

type gitlabClient struct {
	gitlab *gitlab.Client
}

func NewGitlabClient(gitlab *gitlab.Client) GitlabClient {
	return &gitlabClient{
		gitlab: gitlab,
	}
}

func (c *gitlabClient) ListGroupProjects(groupId int, options *gitlab.ListGroupProjectsOptions) ([]model.Project, *gitlab.Response, error) {
	slog.Debug("fetching all projects for group from gitlab API", "group_id", groupId, "page", options.Page, "per_page", options.PerPage)
	projects, response, err := c.gitlab.Groups.ListGroupProjects(groupId, options)
	if err != nil {
		return util.HandleError(make([]model.Project, 0), response, err)
	}

	p, err := util.Convert(projects, make([]model.Project, 0))
	if err != nil {
		slog.Error("unexpected JSON", "error", err.Error())
	}

	return p, response, err
}
