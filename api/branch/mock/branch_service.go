package mock

import "github.com/larscom/gitlab-ci-dashboard/model"

type BranchServiceMock struct {
	Error error
}

func (s *BranchServiceMock) GetBranchesWithLatestPipeline(projectId int) ([]model.BranchWithPipeline, error) {
	if projectId == 1 {
		return []model.BranchWithPipeline{
			{
				Branch: model.Branch{Name: "branch-1"},
			},
		}, s.Error
	}
	return make([]model.BranchWithPipeline, 0), s.Error
}
