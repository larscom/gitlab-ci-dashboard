package mock

import (
	"context"

	"github.com/larscom/gitlab-ci-dashboard/model"
)

type BranchServiceMock struct {
	Error error
}

func (s *BranchServiceMock) GetBranchesWithLatestPipeline(projectId int, ctx context.Context) ([]model.BranchLatestPipeline, error) {
	if projectId == 1 {
		return []model.BranchLatestPipeline{
			{
				Branch: model.Branch{Name: "branch-1"},
			},
		}, s.Error
	}
	return make([]model.BranchLatestPipeline, 0), s.Error
}
