package schedule

import (
	"log/slog"

	"github.com/larscom/gitlab-ci-dashboard/model"
	"github.com/larscom/gitlab-ci-dashboard/util"
	"github.com/xanzy/go-gitlab"
)

type GitlabClient interface {
	ListPipelineSchedules(projectId int, opts *gitlab.ListPipelineSchedulesOptions) ([]model.Schedule, *gitlab.Response, error)
}

type gitlabClient struct {
	gitlab *gitlab.Client
}

func NewGitlabClient(gitlab *gitlab.Client) GitlabClient {
	return &gitlabClient{
		gitlab: gitlab,
	}
}

func (c *gitlabClient) ListPipelineSchedules(projectId int, options *gitlab.ListPipelineSchedulesOptions) ([]model.Schedule, *gitlab.Response, error) {
	slog.Debug("fetching all schedules for project from gitlab API", "project_id", projectId, "page", options.Page, "per_page", options.PerPage)
	schedules, response, err := c.gitlab.PipelineSchedules.ListPipelineSchedules(projectId, options)
	if err != nil {
		return util.HandleError(make([]model.Schedule, 0), response, err)
	}

	p, err := util.Convert(schedules, make([]model.Schedule, 0))
	if err != nil {
		slog.Error("unexpected JSON", "error", err.Error())
	}

	return p, response, err
}
