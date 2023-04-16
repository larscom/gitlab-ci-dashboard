package branch

import (
	"github.com/larscom/gitlab-ci-dashboard/model"
	"github.com/larscom/go-cache"
)

type BranchService interface {
	GetBranchesWithLatestPipeline(projectId int) []model.Branch
}

type BranchServiceImpl struct {
	pipelineLatestLoader cache.Cache[model.PipelineKey, *model.Pipeline]
	branchLoader         cache.Cache[model.ProjectId, []*model.Branch]
}

func NewBranchService(
	pipelineLatestLoader cache.Cache[model.PipelineKey, *model.Pipeline],
	branchLoader cache.Cache[model.ProjectId, []*model.Branch],
) BranchService {
	return &BranchServiceImpl{pipelineLatestLoader, branchLoader}
}

func (s *BranchServiceImpl) GetBranchesWithLatestPipeline(projectId int) []model.Branch {
	branches, _ := s.branchLoader.Get(model.ProjectId(projectId))

	chn := make(chan model.Branch, len(branches))
	for _, branch := range branches {
		go s.getLatestPipeline(projectId, *branch, chn)
	}

	result := make([]model.Branch, len(branches))
	for i := 0; i < len(branches); i++ {
		result[i] = <-chn
	}

	close(chn)

	return result
}

func (s *BranchServiceImpl) getLatestPipeline(projectId int, branch model.Branch, chn chan<- model.Branch) {
	pipeline, _ := s.pipelineLatestLoader.Get(model.NewPipelineKey(projectId, branch.Name, nil))
	branch.LatestPipeline = pipeline
	chn <- branch
}
