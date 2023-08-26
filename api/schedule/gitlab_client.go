package schedule

import (
	"github.com/larscom/gitlab-ci-dashboard/config"
	"github.com/larscom/gitlab-ci-dashboard/util"
	"github.com/xanzy/go-gitlab"
	"log"
	"time"
)

type Schedule struct {
	Id           int       `json:"id"`
	Description  string    `json:"description"`
	Ref          string    `json:"ref"`
	Cron         string    `json:"cron"`
	CronTimezone string    `json:"cron_timezone"`
	NextRunAt    time.Time `json:"next_run_at"`
	Active       bool      `json:"active"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
	Owner        User      `json:"owner"`
}

type User struct {
	Id       int    `json:"id"`
	Username string `json:"username"`
	Name     string `json:"name"`
	State    string `json:"state"`
	IsAdmin  bool   `json:"is_admin"`
}

type GitlabClient interface {
	ListPipelineSchedules(projectId int, opts *gitlab.ListPipelineSchedulesOptions) ([]Schedule, *gitlab.Response, error)
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

func (c *GitlabClientImpl) ListPipelineSchedules(projectId int, options *gitlab.ListPipelineSchedulesOptions) ([]Schedule, *gitlab.Response, error) {
	schedules, response, err := c.client.PipelineSchedules.ListPipelineSchedules(projectId, options)
	if err != nil {
		return util.HandleError(make([]Schedule, 0), response, err)
	}

	p, err := util.Convert(schedules, make([]Schedule, 0))
	if err != nil {
		log.Panicf("unexpected JSON: %v", err)
	}

	return p, response, err
}
