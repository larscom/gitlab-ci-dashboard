package mock

import "github.com/larscom/gitlab-ci-dashboard/model"

type MockGroupClient struct{}

func NewMockGroupClient() *MockGroupClient {
	return &MockGroupClient{}
}

func (c *MockGroupClient) GetGroupsById(ids []int) []*model.Group {
	return []*model.Group{{Name: "Z"}, {Name: "X"}, {Name: "Y"}}
}

func (c *MockGroupClient) GetGroups() []*model.Group {
	return []*model.Group{{Name: "C"}, {Name: "A"}, {Name: "B"}}
}
