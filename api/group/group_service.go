package group

import (
	"sort"

	"github.com/larscom/gitlab-ci-dashboard/config"
)

type Service interface {
	GetGroups() []Group
}

type ServiceImpl struct {
	config *config.GitlabConfig
	client Client
}

func NewService(config *config.GitlabConfig, client Client) Service {
	return &ServiceImpl{
		config,
		client,
	}
}

func (s *ServiceImpl) GetGroups() []Group {
	if len(s.config.GroupOnlyIds) > 0 {
		return sortByName(s.client.GetGroupsById(s.config.GroupOnlyIds))
	}
	return sortByName(s.client.GetGroups())
}

func sortByName(groups []Group) []Group {
	sort.SliceStable(groups[:], func(i, j int) bool {
		return groups[i].Name < groups[j].Name
	})
	return groups
}
