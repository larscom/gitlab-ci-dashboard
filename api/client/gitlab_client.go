package client

import (
	"log"

	"github.com/gofiber/fiber/v2"
	"github.com/larscom/gitlab-ci-dashboard/config"
	"github.com/larscom/gitlab-ci-dashboard/model"
	"github.com/larscom/gitlab-ci-dashboard/util"
	"github.com/xanzy/go-gitlab"
)

type GitlabClient interface {
	ListBranches(int, *gitlab.ListBranchesOptions) ([]*model.Branch, *gitlab.Response, error)

	ListGroups(*gitlab.ListGroupsOptions) ([]*model.Group, *gitlab.Response, error)

	GetGroup(int, *gitlab.GetGroupOptions) (*model.Group, *gitlab.Response, error)

	GetLatestPipeline(int, *gitlab.GetLatestPipelineOptions) (*model.Pipeline, *gitlab.Response, error)
	ListProjectPipelines(int, *gitlab.ListProjectPipelinesOptions) ([]*model.Pipeline, *gitlab.Response, error)

	ListGroupProjects(int, *gitlab.ListGroupProjectsOptions) ([]*model.Project, *gitlab.Response, error)

	ListPipelineSchedules(int, *gitlab.ListPipelineSchedulesOptions) ([]*model.Schedule, *gitlab.Response, error)
}

type GitlabClientImpl struct {
	client *gitlab.Client
}

func NewGitlabClient(config *config.GitlabConfig) GitlabClient {
	client, err := gitlab.NewClient(config.GitlabToken, gitlab.WithBaseURL(config.GitlabUrl))
	if err != nil {
		log.Panicf("failed to create gitlab client: %v\n", err)
	}
	return &GitlabClientImpl{client}
}

func (c *GitlabClientImpl) ListBranches(projectId int, options *gitlab.ListBranchesOptions) ([]*model.Branch, *gitlab.Response, error) {
	branches, response, err := c.client.Branches.ListBranches(projectId, options)
	if response != nil && response.StatusCode == fiber.StatusUnauthorized {
		log.Panicln(err)
	}
	if err != nil {
		return make([]*model.Branch, 0), response, err
	}

	b, err := util.Convert(branches, make([]*model.Branch, 0))
	if err != nil {
		log.Panicf("unexpected JSON: %v", err)
		return make([]*model.Branch, 0), response, err
	}

	return b, response, err
}

func (c *GitlabClientImpl) ListGroups(options *gitlab.ListGroupsOptions) ([]*model.Group, *gitlab.Response, error) {
	groups, response, err := c.client.Groups.ListGroups(options)
	if response != nil && response.StatusCode == fiber.StatusUnauthorized {
		log.Panicln(err)
	}
	if err != nil {
		return make([]*model.Group, 0), response, err
	}

	g, err := util.Convert(groups, make([]*model.Group, 0))
	if err != nil {
		log.Panicf("unexpected JSON: %v", err)
		return make([]*model.Group, 0), response, err
	}

	return g, response, err
}

func (c *GitlabClientImpl) GetGroup(groupId int, options *gitlab.GetGroupOptions) (*model.Group, *gitlab.Response, error) {
	group, response, err := c.client.Groups.GetGroup(groupId, options)
	if response != nil && response.StatusCode == fiber.StatusUnauthorized {
		log.Panicln(err)
	}
	if err != nil {
		return nil, response, err
	}

	g, err := util.Convert(group, new(model.Group))
	if err != nil {
		log.Panicf("unexpected JSON: %v", err)
		return nil, response, err
	}

	return g, response, err
}

func (c *GitlabClientImpl) GetLatestPipeline(projectId int, options *gitlab.GetLatestPipelineOptions) (*model.Pipeline, *gitlab.Response, error) {
	pipeline, response, err := c.client.Pipelines.GetLatestPipeline(projectId, options)
	if response != nil && response.StatusCode == fiber.StatusUnauthorized {
		log.Panicln(err)
	}
	if err != nil {
		return nil, response, err
	}

	p, err := util.Convert(pipeline, new(model.Pipeline))
	if err != nil {
		log.Panicf("unexpected JSON: %v", err)
		return nil, response, err
	}

	return p, response, err
}

func (c *GitlabClientImpl) ListProjectPipelines(projectId int, options *gitlab.ListProjectPipelinesOptions) ([]*model.Pipeline, *gitlab.Response, error) {
	pipelines, response, err := c.client.Pipelines.ListProjectPipelines(projectId, options)
	if response != nil && response.StatusCode == fiber.StatusUnauthorized {
		log.Panicln(err)
	}
	if err != nil {
		return make([]*model.Pipeline, 0), response, err
	}

	p, err := util.Convert(pipelines, make([]*model.Pipeline, 0))
	if err != nil {
		log.Panicf("unexpected JSON: %v", err)
		return make([]*model.Pipeline, 0), response, err
	}

	return p, response, err
}

func (c *GitlabClientImpl) ListGroupProjects(groupId int, options *gitlab.ListGroupProjectsOptions) ([]*model.Project, *gitlab.Response, error) {
	projects, response, err := c.client.Groups.ListGroupProjects(groupId, options)
	if response != nil && response.StatusCode == fiber.StatusUnauthorized {
		log.Panicln(err)
	}
	if err != nil {
		return make([]*model.Project, 0), response, err
	}

	p, err := util.Convert(projects, make([]*model.Project, 0))
	if err != nil {
		log.Panicf("unexpected JSON: %v", err)
		return make([]*model.Project, 0), response, err
	}

	return p, response, err
}

func (g *GitlabClientImpl) ListPipelineSchedules(projectId int, options *gitlab.ListPipelineSchedulesOptions) ([]*model.Schedule, *gitlab.Response, error) {
	schedules, response, err := g.client.PipelineSchedules.ListPipelineSchedules(projectId, options)
	if response != nil && response.StatusCode == fiber.StatusUnauthorized {
		log.Panicln(err)
	}
	if err != nil {
		return make([]*model.Schedule, 0), response, err
	}

	p, err := util.Convert(schedules, make([]*model.Schedule, 0))
	if err != nil {
		log.Panicf("unexpected JSON: %v", err)
		return make([]*model.Schedule, 0), response, err
	}

	return p, response, err
}
