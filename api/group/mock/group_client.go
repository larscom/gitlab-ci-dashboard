package mock

import "github.com/larscom/gitlab-ci-dashboard/data"

type ClientMock struct{}

func NewClientMock() *ClientMock {
	return &ClientMock{}
}

func (c *ClientMock) GetGroupsById(ids []int) []data.Group {
	return []data.Group{{Name: "Z"}, {Name: "X"}, {Name: "Y"}}
}

func (c *ClientMock) GetGroups() []data.Group {
	return []data.Group{{Name: "C"}, {Name: "A"}, {Name: "B"}}
}
