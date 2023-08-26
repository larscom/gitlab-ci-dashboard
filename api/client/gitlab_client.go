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
	ListBranches(projectId int, opts *gitlab.ListBranchesOptions) ([]model.Branch, *gitlab.Response, error)

	ListGroups(opts *gitlab.ListGroupsOptions) ([]model.Group, *gitlab.Response, error)

	GetGroup(groupId int, opts *gitlab.GetGroupOptions) (*model.Group, *gitlab.Response, error)

	GetLatestPipeline(projectId int, opts *gitlab.GetLatestPipelineOptions) (*model.Pipeline, *gitlab.Response, error)

	ListProjectPipelines(projectId int, opts *gitlab.ListProjectPipelinesOptions) ([]model.Pipeline, *gitlab.Response, error)

	ListGroupProjects(groupId int, opts *gitlab.ListGroupProjectsOptions) ([]model.Project, *gitlab.Response, error)

	ListPipelineSchedules(projectId int, opts *gitlab.ListPipelineSchedulesOptions) ([]model.Schedule, *gitlab.Response, error)
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

func (c *GitlabClientImpl) ListBranches(projectId int, options *gitlab.ListBranchesOptions) ([]model.Branch, *gitlab.Response, error) {
	branches, response, err := c.client.Branches.ListBranches(projectId, options)
	if err != nil {
		return handleError(make([]model.Branch, 0), response, err)
	}

	b, err := util.Convert(branches, make([]model.Branch, 0))
	if err != nil {
		log.Panicf("unexpected JSON: %v", err)
	}

	return b, response, err
}

func (c *GitlabClientImpl) ListGroups(options *gitlab.ListGroupsOptions) ([]model.Group, *gitlab.Response, error) {
	groups, response, err := c.client.Groups.ListGroups(options)
	if err != nil {
		return handleError(make([]model.Group, 0), response, err)
	}

	g, err := util.Convert(groups, make([]model.Group, 0))
	if err != nil {
		log.Panicf("unexpected JSON: %v", err)
	}

	return g, response, err
}

func (c *GitlabClientImpl) GetGroup(groupId int, options *gitlab.GetGroupOptions) (*model.Group, *gitlab.Response, error) {
	group, response, err := c.client.Groups.GetGroup(groupId, options)
	if err != nil {
		return handleError[*model.Group](nil, response, err)
	}

	g, err := util.Convert(group, new(model.Group))
	if err != nil {
		log.Panicf("unexpected JSON: %v", err)
	}

	return g, response, err
}

func (c *GitlabClientImpl) GetLatestPipeline(projectId int, options *gitlab.GetLatestPipelineOptions) (*model.Pipeline, *gitlab.Response, error) {
	pipeline, response, err := c.client.Pipelines.GetLatestPipeline(projectId, options)
	if err != nil {
		return handleError[*model.Pipeline](nil, response, err)
	}

	p, err := util.Convert(pipeline, new(model.Pipeline))
	if err != nil {
		log.Panicf("unexpected JSON: %v", err)
	}

	return p, response, err
}

func (c *GitlabClientImpl) ListProjectPipelines(projectId int, options *gitlab.ListProjectPipelinesOptions) ([]model.Pipeline, *gitlab.Response, error) {
	pipelines, response, err := c.client.Pipelines.ListProjectPipelines(projectId, options)
	if err != nil {
		return handleError(make([]model.Pipeline, 0), response, err)
	}

	p, err := util.Convert(pipelines, make([]model.Pipeline, 0))
	if err != nil {
		log.Panicf("unexpected JSON: %v", err)
	}

	return p, response, err
}

func (c *GitlabClientImpl) ListGroupProjects(groupId int, options *gitlab.ListGroupProjectsOptions) ([]model.Project, *gitlab.Response, error) {
	projects, response, err := c.client.Groups.ListGroupProjects(groupId, options)
	if err != nil {
		return handleError(make([]model.Project, 0), response, err)
	}

	p, err := util.Convert(projects, make([]model.Project, 0))
	if err != nil {
		log.Panicf("unexpected JSON: %v", err)
	}

	return p, response, err
}

func (c *GitlabClientImpl) ListPipelineSchedules(projectId int, options *gitlab.ListPipelineSchedulesOptions) ([]model.Schedule, *gitlab.Response, error) {
	schedules, response, err := c.client.PipelineSchedules.ListPipelineSchedules(projectId, options)
	if err != nil {
		return handleError(make([]model.Schedule, 0), response, err)
	}

	p, err := util.Convert(schedules, make([]model.Schedule, 0))
	if err != nil {
		log.Panicf("unexpected JSON: %v", err)
	}

	return p, response, err
}

func handleError[T any](value T, r *gitlab.Response, err error) (T, *gitlab.Response, error) {
	logger := log.Default()

	if r == nil {
		logger.Println("******************************************************")
		logger.Printf("no response from gitlab, err: %v\n", err)
		logger.Println("******************************************************")
		return value, nil, err
	}

	switch r.StatusCode {
	case fiber.StatusUnauthorized:
		logger.Println("******************************************************")
		logger.Println("unauthorized: token invalid/expired")
		logger.Println("******************************************************")
	case fiber.StatusForbidden:
		// do nothing
	case fiber.StatusNotFound:
		logger.Println("******************************************************")
		logger.Println("not found: requested resource can't be found")
		logger.Println("******************************************************")
	default:
		logger.Println("******************************************************")
		logger.Printf("invalid response from gitlab, err: %v\n", err)
		logger.Println("******************************************************")
	}

	return value, r, err
}
