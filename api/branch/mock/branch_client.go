package mock

import (
	"context"

	"github.com/larscom/gitlab-ci-dashboard/model"
)

type ClientMock struct{}

func (c *ClientMock) GetBranches(projectId int, ctx context.Context) ([]model.Branch, error) {
	return []model.Branch{{Name: "branch-1"}}, nil
}
