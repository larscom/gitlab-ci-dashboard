package pipeline

import (
	"log/slog"

	"github.com/larscom/gitlab-ci-dashboard/model"
	"github.com/larscom/gitlab-ci-dashboard/util"
	"github.com/xanzy/go-gitlab"
)

type GitlabClient interface {
	GetLatestPipeline(projectId int, opts *gitlab.GetLatestPipelineOptions) (*model.Pipeline, *gitlab.Response, error)

	ListProjectPipelines(projectId int, opts *gitlab.ListProjectPipelinesOptions) ([]model.Pipeline, *gitlab.Response, error)
}

type gitlabClient struct {
	gitlab *gitlab.Client
}

func NewGitlabClient(gitlab *gitlab.Client) GitlabClient {
	return &gitlabClient{
		gitlab: gitlab,
	}
}

func (c *gitlabClient) GetLatestPipeline(projectId int, options *gitlab.GetLatestPipelineOptions) (*model.Pipeline, *gitlab.Response, error) {
	slog.Debug("fetching latest pipeline for project from gitlab API", "project_id", projectId, "ref", util.IfOrElse(options.Ref != nil, func() string { return *options.Ref }, ""))
	pipeline, response, err := c.gitlab.Pipelines.GetLatestPipeline(projectId, options)
	if err != nil {
		return util.HandleError[*model.Pipeline](nil, response, err)
	}

	p, err := util.Convert(pipeline, new(model.Pipeline))
	if err != nil {
		slog.Error("unexpected JSON", "error", err.Error())
	}

	return p, response, err
}

func (c *gitlabClient) ListProjectPipelines(projectId int, options *gitlab.ListProjectPipelinesOptions) ([]model.Pipeline, *gitlab.Response, error) {
	slog.Debug("fetching all pipelines for project from gitlab API", "project_id", projectId, "ref", util.IfOrElse(options.Ref != nil, func() string { return *options.Ref }, ""), "source", util.IfOrElse(options.Source != nil, func() string { return *options.Source }, ""), "page", options.Page, "per_page", options.PerPage)
	pipelines, response, err := c.gitlab.Pipelines.ListProjectPipelines(projectId, options)
	if err != nil {
		return util.HandleError(make([]model.Pipeline, 0), response, err)
	}

	p, err := util.Convert(pipelines, make([]model.Pipeline, 0))
	if err != nil {
		slog.Error("unexpected JSON", "error", err.Error())
	}

	return p, response, err
}
