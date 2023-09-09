package project

import (
	"github.com/larscom/gitlab-ci-dashboard/model"
	"github.com/larscom/gitlab-ci-dashboard/util"
	"github.com/xanzy/go-gitlab"
	"log"
)

type GitlabClient interface {
	ListGroupProjects(groupId int, opts *gitlab.ListGroupProjectsOptions) ([]model.Project, *gitlab.Response, error)
}

type GitlabClientImpl struct {
	client *gitlab.Client
}

func NewGitlabClient(client *gitlab.Client) GitlabClient {
	return &GitlabClientImpl{
		client,
	}
}

func (c *GitlabClientImpl) ListGroupProjects(groupId int, options *gitlab.ListGroupProjectsOptions) ([]model.Project, *gitlab.Response, error) {
	projects, response, err := c.client.Groups.ListGroupProjects(groupId, options)
	if err != nil {
		return util.HandleError(make([]model.Project, 0), response, err)
	}

	p, err := util.Convert(projects, make([]model.Project, 0))
	if err != nil {
		log.Panicf("unexpected JSON: %v", err)
	}

	return p, response, err
}