package mock

import "github.com/larscom/gitlab-ci-dashboard/model"

type MockBranchClient struct{}

func NewMockBranchClient() *MockBranchClient {
	return &MockBranchClient{}
}

func (c *MockBranchClient) GetBranches(projectId int) []model.Branch {
	return []model.Branch{{Name: "branch-1"}}
}
