package mock

import "github.com/larscom/gitlab-ci-dashboard/model"

type GroupServiceMock struct {
	Empty bool
	Error error
}

func (s *GroupServiceMock) GetGroups() ([]model.Group, error) {
	if s.Empty {
		return make([]model.Group, 0), s.Error
	}
	return []model.Group{{Name: "group-1"}}, s.Error
}
