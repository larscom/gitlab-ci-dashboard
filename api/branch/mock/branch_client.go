package mock

import "github.com/larscom/gitlab-ci-dashboard/data"

type ClientMock struct{}

func NewClientMock() *ClientMock {
	return &ClientMock{}
}

func (c *ClientMock) GetBranches(projectId int) []data.Branch {
	return []data.Branch{{Name: "branch-1"}}
}
