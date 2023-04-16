package server

import (
	"github.com/larscom/gitlab-ci-dashboard/branch"
	"github.com/larscom/gitlab-ci-dashboard/group"
	"github.com/larscom/gitlab-ci-dashboard/pipeline"
	"github.com/larscom/gitlab-ci-dashboard/project"
	"github.com/larscom/gitlab-ci-dashboard/schedule"
)

type Clients struct {
	projectClient  project.ProjectClient
	groupClient    group.GroupClient
	pipelineClient pipeline.PipelineClient
	branchClient   branch.BranchClient
	scheduleClient schedule.ScheduleClient
}

func NewClients(
	projectClient project.ProjectClient,
	groupClient group.GroupClient,
	pipelineClient pipeline.PipelineClient,
	branchClient branch.BranchClient,
	scheduleClient schedule.ScheduleClient,
) *Clients {
	return &Clients{projectClient, groupClient, pipelineClient, branchClient, scheduleClient}
}
