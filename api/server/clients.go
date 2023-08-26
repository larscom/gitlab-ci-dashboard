package server

import (
	"github.com/larscom/gitlab-ci-dashboard/branch"
	"github.com/larscom/gitlab-ci-dashboard/group"
	"github.com/larscom/gitlab-ci-dashboard/pipeline"
	"github.com/larscom/gitlab-ci-dashboard/project"
	"github.com/larscom/gitlab-ci-dashboard/schedule"
)

type Clients struct {
	projectClient  project.Client
	groupClient    group.Client
	pipelineClient pipeline.Client
	branchClient   branch.Client
	scheduleClient schedule.Client
}

func NewClients(
	projectClient project.Client,
	groupClient group.Client,
	pipelineClient pipeline.Client,
	branchClient branch.Client,
	scheduleClient schedule.Client,
) *Clients {
	return &Clients{
		projectClient,
		groupClient,
		pipelineClient,
		branchClient,
		scheduleClient,
	}
}
