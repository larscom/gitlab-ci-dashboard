package job

import (
	"log/slog"

	"github.com/larscom/gitlab-ci-dashboard/model"
	"github.com/larscom/gitlab-ci-dashboard/util"
	"github.com/xanzy/go-gitlab"
)

type GitlabClient interface {
	ListPipelineJobs(projectId int, pipelineId int, options *gitlab.ListJobsOptions) ([]model.Job, *gitlab.Response, error)
}

type gitlabClient struct {
	gitlab *gitlab.Client
}

func NewGitlabClient(gitlab *gitlab.Client) GitlabClient {
	return &gitlabClient{
		gitlab: gitlab,
	}
}

func (c *gitlabClient) ListPipelineJobs(projectId int, pipelineId int, options *gitlab.ListJobsOptions) ([]model.Job, *gitlab.Response, error) {
	slog.Debug("fetching all jobs for pipeline from gitlab API", "project_id", projectId, "pipeline_id", pipelineId, "page", options.Page, "per_page", options.PerPage)
	jobs, response, err := c.gitlab.Jobs.ListPipelineJobs(projectId, pipelineId, options)
	if err != nil {
		return util.HandleError(make([]model.Job, 0), response, err)
	}

	p, err := util.Convert(jobs, make([]model.Job, 0))
	if err != nil {
		slog.Error("unexpected JSON", "error", err.Error())
	}

	return p, response, err
}
