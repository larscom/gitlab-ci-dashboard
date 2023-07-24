package group

import (
	"sort"

	"github.com/larscom/gitlab-ci-dashboard/config"
	"github.com/larscom/gitlab-ci-dashboard/model"
)

type GroupService interface {
	GetGroups() []model.Group
}

type GroupServiceImpl struct {
	config *config.GitlabConfig
	client GroupClient
}

func NewGroupService(config *config.GitlabConfig, client GroupClient) GroupService {
	return &GroupServiceImpl{config, client}
}

func (s *GroupServiceImpl) GetGroups() []model.Group {
	if len(s.config.GroupOnlyIds) > 0 {
		return sortByName(s.client.GetGroupsById(s.config.GroupOnlyIds))
	}
	return sortByName(s.client.GetGroups())
}

func sortByName(groups []model.Group) []model.Group {
	sort.SliceStable(groups[:], func(i, j int) bool {
		return groups[i].Name < groups[j].Name
	})
	return groups
}
