package group

import (
	"github.com/larscom/gitlab-ci-dashboard/model"
	"github.com/larscom/gitlab-ci-dashboard/util"
	"github.com/xanzy/go-gitlab"
	"log"
)

type GitlabClient interface {
	ListGroups(*gitlab.ListGroupsOptions) ([]model.Group, *gitlab.Response, error)

	GetGroup(model.GroupId, *gitlab.GetGroupOptions) (*model.Group, *gitlab.Response, error)
}

type GitlabClientImpl struct {
	client *gitlab.Client
}

func NewGitlabClient(client *gitlab.Client) GitlabClient {
	return &GitlabClientImpl{
		client,
	}
}

func (c *GitlabClientImpl) ListGroups(options *gitlab.ListGroupsOptions) ([]model.Group, *gitlab.Response, error) {
	groups, response, err := c.client.Groups.ListGroups(options)
	if err != nil {
		return util.HandleError(make([]model.Group, 0), response, err)
	}

	g, err := util.Convert(groups, make([]model.Group, 0))
	if err != nil {
		log.Panicf("unexpected JSON: %v", err)
	}

	return g, response, err
}

func (c *GitlabClientImpl) GetGroup(id model.GroupId, options *gitlab.GetGroupOptions) (*model.Group, *gitlab.Response, error) {
	group, response, err := c.client.Groups.GetGroup(id, options)
	if err != nil {
		return util.HandleError[*model.Group](nil, response, err)
	}

	g, err := util.Convert(group, new(model.Group))
	if err != nil {
		log.Panicf("unexpected JSON: %v", err)
	}

	return g, response, err
}
