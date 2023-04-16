package branch

import (
	"testing"

	"github.com/larscom/gitlab-ci-dashboard/model"
	"github.com/larscom/go-cache"
	"github.com/stretchr/testify/assert"
)

func TestGetBranchesWithLatestPipeline(t *testing.T) {
	pipelineLatestLoader := cache.New[model.PipelineKey, *model.Pipeline]()
	branchLoader := cache.New[model.ProjectId, []*model.Branch]()

	projectId := 1
	ref := "branch-1"

	branchLoader.Put(model.ProjectId(projectId), []*model.Branch{{Name: ref}})
	pipelineLatestLoader.Put(model.NewPipelineKey(projectId, ref, nil), &model.Pipeline{Status: "success"})

	service := NewBranchService(pipelineLatestLoader, branchLoader)

	branches := service.GetBranchesWithLatestPipeline(projectId)

	assert.Len(t, branches, 1)
	assert.Equal(t, "branch-1", branches[0].Name)
	assert.Equal(t, "success", branches[0].LatestPipeline.Status)
}
