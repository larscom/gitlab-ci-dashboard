package mock

import "github.com/larscom/gitlab-ci-dashboard/model"

type BranchClient struct{}

func NewBranchClient() *BranchClient {
	return &BranchClient{}
}

func (c *BranchClient) GetBranches(projectId int) []model.Branch {
	return []model.Branch{{Name: "branch-1"}}
}
