package server

import (
	"github.com/larscom/gitlab-ci-dashboard/branch"
	"github.com/larscom/gitlab-ci-dashboard/group"
	"github.com/larscom/gitlab-ci-dashboard/pipeline"
	"github.com/larscom/gitlab-ci-dashboard/project"
)

type clientConfig struct {
	projectClient  project.ProjectClient
	groupClient    group.GroupClient
	pipelineClient pipeline.PipelineClient
	branchClient   branch.BranchClient
}

func newClientConfig(
	projectClient project.ProjectClient,
	groupClient group.GroupClient,
	pipelineClient pipeline.PipelineClient,
	branchClient branch.BranchClient,
) *clientConfig {
	return &clientConfig{
		projectClient,
		groupClient,
		pipelineClient,
		branchClient,
	}
}
