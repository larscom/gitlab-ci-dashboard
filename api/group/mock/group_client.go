package mock

import "github.com/larscom/gitlab-ci-dashboard/model"

type ClientMock struct{}

func (c *ClientMock) GetGroupsById(ids []int) ([]model.Group, error) {
	return []model.Group{{Name: "Z"}, {Name: "X"}, {Name: "Y"}}, nil
}

func (c *ClientMock) GetGroups() ([]model.Group, error) {
	return []model.Group{{Name: "C"}, {Name: "A"}, {Name: "B"}}, nil
}
