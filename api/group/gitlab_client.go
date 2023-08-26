package group

import (
	"github.com/larscom/gitlab-ci-dashboard/config"
	"github.com/larscom/gitlab-ci-dashboard/util"
	"github.com/xanzy/go-gitlab"
	"log"
)

type Group struct {
	Id   int    `json:"id"`
	Name string `json:"name"`
}

type GitlabClient interface {
	ListGroups(opts *gitlab.ListGroupsOptions) ([]Group, *gitlab.Response, error)

	GetGroup(groupId int, opts *gitlab.GetGroupOptions) (*Group, *gitlab.Response, error)
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

func (c *GitlabClientImpl) ListGroups(options *gitlab.ListGroupsOptions) ([]Group, *gitlab.Response, error) {
	groups, response, err := c.client.Groups.ListGroups(options)
	if err != nil {
		return util.HandleError(make([]Group, 0), response, err)
	}

	g, err := util.Convert(groups, make([]Group, 0))
	if err != nil {
		log.Panicf("unexpected JSON: %v", err)
	}

	return g, response, err
}

func (c *GitlabClientImpl) GetGroup(groupId int, options *gitlab.GetGroupOptions) (*Group, *gitlab.Response, error) {
	group, response, err := c.client.Groups.GetGroup(groupId, options)
	if err != nil {
		return util.HandleError[*Group](nil, response, err)
	}

	g, err := util.Convert(group, new(Group))
	if err != nil {
		log.Panicf("unexpected JSON: %v", err)
	}

	return g, response, err
}
