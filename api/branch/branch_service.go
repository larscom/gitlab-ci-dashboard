package branch

import (
	"github.com/larscom/gitlab-ci-dashboard/data"
	"github.com/larscom/gitlab-ci-dashboard/pipeline"
	"github.com/larscom/go-cache"
	"sort"
	"sync"
)

type Service interface {
	GetBranchesWithLatestPipeline(projectId int) []data.BranchWithPipeline
}

type ServiceImpl struct {
	pipelineLatestLoader cache.Cache[pipeline.Key, *data.Pipeline]
	branchesLoader       cache.Cache[int, []data.Branch]
}

func NewService(
	pipelineLatestLoader cache.Cache[pipeline.Key, *data.Pipeline],
	branchesLoader cache.Cache[int, []data.Branch],
) Service {
	return &ServiceImpl{
		pipelineLatestLoader,
		branchesLoader,
	}
}

func (s *ServiceImpl) GetBranchesWithLatestPipeline(projectId int) []data.BranchWithPipeline {
	branches, _ := s.branchesLoader.Get(int(projectId))

	chn := make(chan data.BranchWithPipeline, len(branches))

	var wg sync.WaitGroup
	for _, branch := range branches {
		wg.Add(1)
		go s.getLatestPipeline(projectId, &wg, branch, chn)
	}

	go func() {
		defer close(chn)
		wg.Wait()
	}()

	result := make([]data.BranchWithPipeline, 0)
	for value := range chn {
		result = append(result, value)
	}

	return sortByUpdatedDate(result)
}

func (s *ServiceImpl) getLatestPipeline(projectId int, wg *sync.WaitGroup, branch data.Branch, chn chan<- data.BranchWithPipeline) {
	defer wg.Done()
	pipeline, _ := s.pipelineLatestLoader.Get(pipeline.NewPipelineKey(projectId, branch.Name, nil))
	chn <- data.BranchWithPipeline{
		Branch:   branch,
		Pipeline: pipeline,
	}
}

func sortByUpdatedDate(branches []data.BranchWithPipeline) []data.BranchWithPipeline {
	sort.SliceStable(branches[:], func(i, j int) bool {
		pipelineA := branches[i].Pipeline
		pipelineB := branches[j].Pipeline

		if pipelineA == nil {
			return false
		}
		if pipelineB == nil {
			return true
		}

		return pipelineA.UpdatedAt.After(pipelineB.UpdatedAt)
	})

	return branches
}
