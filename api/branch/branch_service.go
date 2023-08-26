package branch

import (
	"github.com/larscom/gitlab-ci-dashboard/pipeline"
	"github.com/larscom/go-cache"
	"sort"
	"sync"
)

type BranchWithPipeline struct {
	Branch   Branch             `json:"branch"`
	Pipeline *pipeline.Pipeline `json:"pipeline"`
}

type Service interface {
	GetBranchesWithLatestPipeline(projectId int) []BranchWithPipeline
}

type ServiceImpl struct {
	pipelineLatestLoader cache.Cache[pipeline.Key, *pipeline.Pipeline]
	branchesLoader       cache.Cache[int, []Branch]
}

func NewService(
	pipelineLatestLoader cache.Cache[pipeline.Key, *pipeline.Pipeline],
	branchesLoader cache.Cache[int, []Branch],
) Service {
	return &ServiceImpl{
		pipelineLatestLoader,
		branchesLoader,
	}
}

func (s *ServiceImpl) GetBranchesWithLatestPipeline(projectId int) []BranchWithPipeline {
	branches, _ := s.branchesLoader.Get(int(projectId))

	chn := make(chan BranchWithPipeline, len(branches))

	var wg sync.WaitGroup
	for _, branch := range branches {
		wg.Add(1)
		go s.getLatestPipeline(projectId, &wg, branch, chn)
	}

	go func() {
		defer close(chn)
		wg.Wait()
	}()

	result := make([]BranchWithPipeline, 0)
	for value := range chn {
		result = append(result, value)
	}

	return sortByUpdatedDate(result)
}

func (s *ServiceImpl) getLatestPipeline(projectId int, wg *sync.WaitGroup, branch Branch, chn chan<- BranchWithPipeline) {
	defer wg.Done()
	pipeline, _ := s.pipelineLatestLoader.Get(pipeline.NewPipelineKey(projectId, branch.Name, nil))
	chn <- BranchWithPipeline{
		Branch:   branch,
		Pipeline: pipeline,
	}
}

func sortByUpdatedDate(branches []BranchWithPipeline) []BranchWithPipeline {
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
