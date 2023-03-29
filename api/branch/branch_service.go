package branch

import (
	"github.com/larscom/gitlab-ci-dashboard/model"
	"github.com/larscom/go-cache"
)

type BranchService interface {
	GetBranchesWithLatestPipeline(projectId int) []*model.BranchPipeline
}

type BranchServiceImpl struct {
	pipelineLatestLoader cache.ICache[model.PipelineKey, *model.Pipeline]
	branchLoader         cache.ICache[model.ProjectId, []*model.Branch]
}

func NewBranchService(
	pipelineLatestLoader cache.ICache[model.PipelineKey, *model.Pipeline],
	branchLoader cache.ICache[model.ProjectId, []*model.Branch],
) BranchService {
	return &BranchServiceImpl{pipelineLatestLoader, branchLoader}
}

func (s *BranchServiceImpl) GetBranchesWithLatestPipeline(projectId int) []*model.BranchPipeline {
	branches, _ := s.branchLoader.Get(model.ProjectId(projectId))

	result := make(chan *model.BranchPipeline, len(branches))

	for _, branch := range branches {
		go s.getBranchWithLatestPipeline(projectId, branch, result)
	}

	b := make([]*model.BranchPipeline, len(branches))
	for i := 0; i < len(branches); i++ {
		b[i] = <-result
	}

	close(result)

	return b
}

func (s *BranchServiceImpl) getBranchWithLatestPipeline(projectId int, branch *model.Branch, result chan<- *model.BranchPipeline) {
	pipeline, _ := s.pipelineLatestLoader.Get(model.NewPipelineKey(projectId, branch.Name))
	result <- &model.BranchPipeline{Branch: branch, Pipeline: pipeline}
}
