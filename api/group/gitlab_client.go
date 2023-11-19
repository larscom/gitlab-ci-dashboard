package group

import (
	"log"

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
	groups, response, err := c.gitlab.Groups.ListGroups(options)
	if err != nil {
		return util.HandleError(make([]model.Group, 0), response, err)
	}

	g, err := util.Convert(groups, make([]model.Group, 0))
	if err != nil {
		log.Panicf("unexpected JSON: %v", err)
	}

	return g, response, err
}

func (c *gitlabClient) GetGroup(groupId int, options *gitlab.GetGroupOptions) (*model.Group, *gitlab.Response, error) {
	group, response, err := c.gitlab.Groups.GetGroup(groupId, options)
	if err != nil {
		return util.HandleError[*model.Group](nil, response, err)
	}

	g, err := util.Convert(group, new(model.Group))
	if err != nil {
		log.Panicf("unexpected JSON: %v", err)
	}

	return g, response, err
}
