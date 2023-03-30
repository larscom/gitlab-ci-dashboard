package server

import (
	"github.com/larscom/gitlab-ci-dashboard/branch"
	"github.com/larscom/gitlab-ci-dashboard/group"
	"github.com/larscom/gitlab-ci-dashboard/pipeline"
	"github.com/larscom/gitlab-ci-dashboard/project"
)

type Clients struct {
	projectClient  project.ProjectClient
	groupClient    group.GroupClient
	pipelineClient pipeline.PipelineClient
	branchClient   branch.BranchClient
}

func NewClients(
	projectClient project.ProjectClient,
	groupClient group.GroupClient,
	pipelineClient pipeline.PipelineClient,
	branchClient branch.BranchClient,
) *Clients {
	return &Clients{
		projectClient,
		groupClient,
		pipelineClient,
		branchClient,
	}
}
