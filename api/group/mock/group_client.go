package mock

import "github.com/larscom/gitlab-ci-dashboard/model"

type ClientMock struct{}

func NewClientMock() *ClientMock {
	return &ClientMock{}
}

func (c *ClientMock) GetGroupsById(ids []int) []model.Group {
	return []model.Group{{Name: "Z"}, {Name: "X"}, {Name: "Y"}}
}

func (c *ClientMock) GetGroups() []model.Group {
	return []model.Group{{Name: "C"}, {Name: "A"}, {Name: "B"}}
}
