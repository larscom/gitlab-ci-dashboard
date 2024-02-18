package mock

import (
	"context"

	"github.com/larscom/gitlab-ci-dashboard/model"
)

type ClientMock struct{}

func (c *ClientMock) GetGroupsById(ids []int, ctx context.Context) ([]model.Group, error) {
	return []model.Group{{Name: "Z"}, {Name: "X"}, {Name: "Y"}}, nil
}

func (c *ClientMock) GetGroups(ctx context.Context) ([]model.Group, error) {
	return []model.Group{{Name: "C"}, {Name: "A"}, {Name: "B"}}, nil
}
