package branch

import (
	"sort"

	"github.com/larscom/gitlab-ci-dashboard/model"
	"github.com/larscom/go-cache"
)

type BranchService interface {
	GetBranchesWithLatestPipeline(projectId int) []model.BranchWithLatestPipeline
}

type BranchServiceImpl struct {
	pipelineLatestLoader cache.Cache[model.PipelineKey, *model.Pipeline]
	branchLoader         cache.Cache[model.ProjectId, []model.Branch]
}

func NewBranchService(
	pipelineLatestLoader cache.Cache[model.PipelineKey, *model.Pipeline],
	branchLoader cache.Cache[model.ProjectId, []model.Branch],
) BranchService {
	return &BranchServiceImpl{
		pipelineLatestLoader,
		branchLoader,
	}
}

func (s *BranchServiceImpl) GetBranchesWithLatestPipeline(projectId int) []model.BranchWithLatestPipeline {
	branches, _ := s.branchLoader.Get(model.ProjectId(projectId))

	chn := make(chan model.BranchWithLatestPipeline, len(branches))
	for _, branch := range branches {
		go s.getLatestPipeline(projectId, branch, chn)
	}

	result := make([]model.BranchWithLatestPipeline, len(branches))
	for i := 0; i < len(branches); i++ {
		result[i] = <-chn
	}

	close(chn)

	return sortByUpdatedDate(result)
}

func (s *BranchServiceImpl) getLatestPipeline(projectId int, branch model.Branch, chn chan<- model.BranchWithLatestPipeline) {
	pipeline, _ := s.pipelineLatestLoader.Get(model.NewPipelineKey(projectId, branch.Name, nil))
	chn <- model.BranchWithLatestPipeline{
		Branch:         branch,
		LatestPipeline: pipeline,
	}
}

func sortByUpdatedDate(branches []model.BranchWithLatestPipeline) []model.BranchWithLatestPipeline {
	sort.SliceStable(branches[:], func(a, b int) bool {
		pipelineA := branches[a].LatestPipeline
		pipelineB := branches[b].LatestPipeline

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
