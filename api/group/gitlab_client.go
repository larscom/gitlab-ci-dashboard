package group

import (
	"log/slog"

	"github.com/larscom/gitlab-ci-dashboard/model"
	"github.com/larscom/gitlab-ci-dashboard/util"
	"github.com/xanzy/go-gitlab"
)

type GitlabClient interface {
	ListGroups(opts *gitlab.ListGroupsOptions) ([]model.Group, *gitlab.Response, error)

	GetGroup(groupId int, opts *gitlab.GetGroupOptions) (*model.Group, *gitlab.Response, error)
}

type gitlabClient struct {
	gitlab *gitlab.Client
}

func NewGitlabClient(gitlab *gitlab.Client) GitlabClient {
	return &gitlabClient{
		gitlab: gitlab,
	}
}

func (c *gitlabClient) ListGroups(options *gitlab.ListGroupsOptions) ([]model.Group, *gitlab.Response, error) {
	slog.Debug("fetching all groups from gitlab API", "page", options.Page, "per_page", options.PerPage)
	groups, response, err := c.gitlab.Groups.ListGroups(options)
	if err != nil {
		return util.HandleError(make([]model.Group, 0), response, err)
	}

	g, err := util.Convert(groups, make([]model.Group, 0))
	if err != nil {
		slog.Error("unexpected JSON", "error", err.Error())
	}

	return g, response, err
}

func (c *gitlabClient) GetGroup(groupId int, options *gitlab.GetGroupOptions) (*model.Group, *gitlab.Response, error) {
	slog.Debug("fetching group from gitlab API", "group_id", groupId)
	group, response, err := c.gitlab.Groups.GetGroup(groupId, options)
	if err != nil {
		return util.HandleError[*model.Group](nil, response, err)
	}

	g, err := util.Convert(group, new(model.Group))
	if err != nil {
		slog.Error("unexpected JSON", "error", err.Error())
	}

	return g, response, err
}
