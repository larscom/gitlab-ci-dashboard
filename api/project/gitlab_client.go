package project

import (
	"github.com/larscom/gitlab-ci-dashboard/config"
	"github.com/larscom/gitlab-ci-dashboard/data"
	"github.com/larscom/gitlab-ci-dashboard/util"
	"github.com/xanzy/go-gitlab"
	"log"
)

type GitlabClient interface {
	ListGroupProjects(groupId int, opts *gitlab.ListGroupProjectsOptions) ([]data.Project, *gitlab.Response, error)
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

func (c *GitlabClientImpl) ListGroupProjects(groupId int, options *gitlab.ListGroupProjectsOptions) ([]data.Project, *gitlab.Response, error) {
	projects, response, err := c.client.Groups.ListGroupProjects(groupId, options)
	if err != nil {
		return util.HandleError(make([]data.Project, 0), response, err)
	}

	p, err := util.Convert(projects, make([]data.Project, 0))
	if err != nil {
		log.Panicf("unexpected JSON: %v", err)
	}

	return p, response, err
}
