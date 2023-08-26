package mock

import "github.com/larscom/gitlab-ci-dashboard/model"

type GroupClient struct{}

func NewGroupClient() *GroupClient {
	return &GroupClient{}
}

func (c *GroupClient) GetGroupsById(ids []int) []model.Group {
	return []model.Group{{Name: "Z"}, {Name: "X"}, {Name: "Y"}}
}

func (c *GroupClient) GetGroups() []model.Group {
	return []model.Group{{Name: "C"}, {Name: "A"}, {Name: "B"}}
}
