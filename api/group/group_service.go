package group

import (
	"github.com/larscom/gitlab-ci-dashboard/data"
	"sort"

	"github.com/larscom/gitlab-ci-dashboard/config"
)

type Service interface {
	GetGroups() []data.Group
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

func (s *ServiceImpl) GetGroups() []data.Group {
	if len(s.config.GroupOnlyIds) > 0 {
		return sortByName(s.client.GetGroupsById(s.config.GroupOnlyIds))
	}
	return sortByName(s.client.GetGroups())
}

func sortByName(groups []data.Group) []data.Group {
	sort.SliceStable(groups[:], func(i, j int) bool {
		return groups[i].Name < groups[j].Name
	})
	return groups
}
