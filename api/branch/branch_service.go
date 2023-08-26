package branch

import (
	"github.com/larscom/gitlab-ci-dashboard/pipeline"
	"sort"
	"sync"

	"github.com/larscom/gitlab-ci-dashboard/model"
	"github.com/larscom/go-cache"
)

type Service interface {
	GetBranchesWithLatestPipeline(projectId int) []model.BranchWithPipeline
}

type ServiceImpl struct {
	pipelineLatestLoader cache.Cache[pipeline.Key, *model.Pipeline]
	branchesLoader       cache.Cache[model.ProjectId, []model.Branch]
}

func NewService(
	pipelineLatestLoader cache.Cache[pipeline.Key, *model.Pipeline],
	branchesLoader cache.Cache[model.ProjectId, []model.Branch],
) Service {
	return &ServiceImpl{
		pipelineLatestLoader,
		branchesLoader,
	}
}

func (s *ServiceImpl) GetBranchesWithLatestPipeline(projectId int) []model.BranchWithPipeline {
	branches, _ := s.branchesLoader.Get(model.ProjectId(projectId))

	chn := make(chan model.BranchWithPipeline, len(branches))

	var wg sync.WaitGroup
	for _, branch := range branches {
		wg.Add(1)
		go s.getLatestPipeline(projectId, &wg, branch, chn)
	}

	go func() {
		defer close(chn)
		wg.Wait()
	}()

	result := make([]model.BranchWithPipeline, 0)
	for value := range chn {
		result = append(result, value)
	}

	return sortByUpdatedDate(result)
}

func (s *ServiceImpl) getLatestPipeline(projectId int, wg *sync.WaitGroup, branch model.Branch, chn chan<- model.BranchWithPipeline) {
	defer wg.Done()
	pipeline, _ := s.pipelineLatestLoader.Get(pipeline.NewPipelineKey(projectId, branch.Name, nil))
	chn <- model.BranchWithPipeline{
		Branch:   branch,
		Pipeline: pipeline,
	}
}

func sortByUpdatedDate(branches []model.BranchWithPipeline) []model.BranchWithPipeline {
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
