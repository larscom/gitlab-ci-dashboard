package branch

import (
	"github.com/larscom/gitlab-ci-dashboard/data"
	"github.com/larscom/gitlab-ci-dashboard/pipeline"
	"testing"
	"time"

	"github.com/larscom/go-cache"
	"github.com/stretchr/testify/assert"
)

func TestGetBranchesWithLatestPipeline(t *testing.T) {
	var (
		pipelineLatestLoader = cache.New[pipeline.Key, *data.Pipeline]()
		branchesLoader       = cache.New[int, []data.Branch]()
		service              = NewService(pipelineLatestLoader, branchesLoader)
		projectId            = 1
		ref                  = "branch-1"
		status               = "success"
	)

	branchesLoader.Put(projectId, []data.Branch{{Name: ref}})
	pipelineLatestLoader.Put(pipeline.NewPipelineKey(projectId, ref, nil), &data.Pipeline{Status: status})

	result := service.GetBranchesWithLatestPipeline(projectId)

	assert.Len(t, result, 1)
	assert.Equal(t, ref, result[0].Branch.Name)
	assert.Equal(t, status, result[0].Pipeline.Status)
}

func TestGetBranchesWithLatestPipelineSortedByUpdatedDate(t *testing.T) {
	var (
		pipelineLatestLoader = cache.New[pipeline.Key, *data.Pipeline]()
		branchesLoader       = cache.New[int, []data.Branch]()
		service              = NewService(pipelineLatestLoader, branchesLoader)
		projectId            = 1
		now                  = time.Now()
	)

	branchesLoader.Put(projectId, []data.Branch{{Name: "branch-1"}, {Name: "branch-2"}, {Name: "branch-3"}})

	pipelineLatestLoader.Put(pipeline.NewPipelineKey(projectId, "branch-1", nil), &data.Pipeline{Status: "success", UpdatedAt: now.Add(-10 * time.Minute)})
	pipelineLatestLoader.Put(pipeline.NewPipelineKey(projectId, "branch-2", nil), &data.Pipeline{Status: "success", UpdatedAt: now.Add(-2 * time.Minute)})
	pipelineLatestLoader.Put(pipeline.NewPipelineKey(projectId, "branch-3", nil), &data.Pipeline{Status: "success", UpdatedAt: now.Add(-5 * time.Minute)})

	result := service.GetBranchesWithLatestPipeline(projectId)

	assert.Len(t, result, 3)
	assert.Equal(t, "branch-2", result[0].Branch.Name)
	assert.Equal(t, "branch-3", result[1].Branch.Name)
	assert.Equal(t, "branch-1", result[2].Branch.Name)
}

func TestGetBranchesWithLatestPipelineSortedByUpdatedDateWithNil(t *testing.T) {
	var (
		pipelineLatestLoader = cache.New[pipeline.Key, *data.Pipeline]()
		branchesLoader       = cache.New[int, []data.Branch]()
		service              = NewService(pipelineLatestLoader, branchesLoader)
		projectId            = 1
		now                  = time.Now()
	)

	branchesLoader.Put(projectId, []data.Branch{{Name: "branch-1"}, {Name: "branch-2"}, {Name: "branch-3"}, {Name: "branch-4"}})

	pipelineLatestLoader.Put(pipeline.NewPipelineKey(projectId, "branch-1", nil), &data.Pipeline{Status: "success", UpdatedAt: now.Add(-10 * time.Minute)})
	pipelineLatestLoader.Put(pipeline.NewPipelineKey(projectId, "branch-2", nil), nil)
	pipelineLatestLoader.Put(pipeline.NewPipelineKey(projectId, "branch-3", nil), &data.Pipeline{Status: "success", UpdatedAt: now.Add(-2 * time.Minute)})
	pipelineLatestLoader.Put(pipeline.NewPipelineKey(projectId, "branch-4", nil), nil)

	result := service.GetBranchesWithLatestPipeline(projectId)

	assert.Len(t, result, 4)
	assert.Equal(t, "branch-3", result[0].Branch.Name)
	assert.Equal(t, "branch-1", result[1].Branch.Name)

	rest := result[2:]
	assert.Len(t, rest, 2)

	branchNames := []string{rest[0].Branch.Name, rest[1].Branch.Name}
	assert.ElementsMatch(t, branchNames, []string{"branch-2", "branch-4"})
}
