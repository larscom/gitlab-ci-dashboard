package server

import (
	"github.com/larscom/gitlab-ci-dashboard/branch"
	"github.com/larscom/gitlab-ci-dashboard/group"
	"github.com/larscom/gitlab-ci-dashboard/job"
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
	jobClient      job.JobClient
}

func NewClients(
	projectClient project.ProjectClient,
	groupClient group.GroupClient,
	pipelineClient pipeline.PipelineClient,
	branchClient branch.BranchClient,
	scheduleClient schedule.ScheduleClient,
	jobClient job.JobClient,
) *Clients {
	return &Clients{
		projectClient:  projectClient,
		groupClient:    groupClient,
		pipelineClient: pipelineClient,
		branchClient:   branchClient,
		scheduleClient: scheduleClient,
		jobClient:      jobClient,
	}
}
