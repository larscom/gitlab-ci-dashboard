package mock

import "github.com/larscom/gitlab-ci-dashboard/model"

type ClientMock struct{}

func (c *ClientMock) GetBranches(projectId int) ([]model.Branch, error) {
	return []model.Branch{{Name: "branch-1"}}, nil
}
