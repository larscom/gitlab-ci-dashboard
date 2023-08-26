package mock

import "github.com/larscom/gitlab-ci-dashboard/model"

type ClientMock struct{}

func NewClientMock() *ClientMock {
	return &ClientMock{}
}

func (c *ClientMock) GetBranches(projectId int) []model.Branch {
	return []model.Branch{{Name: "branch-1"}}
}
