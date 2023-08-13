package branch

import (
	"sort"

	"github.com/larscom/gitlab-ci-dashboard/model"
	"github.com/larscom/go-cache"
)

type BranchService interface {
	GetBranchesWithLatestPipeline(projectId int) []model.BranchWithPipeline
}

type BranchServiceImpl struct {
	pipelineLatestLoader cache.Cache[model.PipelineKey, *model.Pipeline]
	branchesLoader       cache.Cache[model.ProjectId, []model.Branch]
}

func NewBranchService(
	pipelineLatestLoader cache.Cache[model.PipelineKey, *model.Pipeline],
	branchesLoader cache.Cache[model.ProjectId, []model.Branch],
) BranchService {
	return &BranchServiceImpl{
		pipelineLatestLoader,
		branchesLoader,
	}
}

func (s *BranchServiceImpl) GetBranchesWithLatestPipeline(projectId int) []model.BranchWithPipeline {
	branches, _ := s.branchesLoader.Get(model.ProjectId(projectId))

	chn := make(chan model.BranchWithPipeline, len(branches))
	for _, branch := range branches {
		go s.getLatestPipeline(projectId, branch, chn)
	}

	result := make([]model.BranchWithPipeline, len(branches))
	for i := 0; i < len(branches); i++ {
		result[i] = <-chn
	}

	close(chn)

	return sortByUpdatedDate(result)
}

func (s *BranchServiceImpl) getLatestPipeline(projectId int, branch model.Branch, chn chan<- model.BranchWithPipeline) {
	pipeline, _ := s.pipelineLatestLoader.Get(model.NewPipelineKey(projectId, branch.Name, nil))
	chn <- model.BranchWithPipeline{
		Branch:   branch,
		Pipeline: pipeline,
	}
}

func sortByUpdatedDate(branches []model.BranchWithPipeline) []model.BranchWithPipeline {
	sort.SliceStable(branches[:], func(a, b int) bool {
		pipelineA := branches[a].Pipeline
		pipelineB := branches[b].Pipeline

		if pipelineA != nil && pipelineB == nil {
			return true
		}
		if pipelineA == nil && pipelineB != nil {
			return false
		}
		if pipelineA == nil && pipelineB == nil {
			return false
		}

		return pipelineA.UpdatedAt.After(pipelineB.UpdatedAt)
	})
	return branches
}
