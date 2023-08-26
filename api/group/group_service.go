package group

import (
	"github.com/larscom/gitlab-ci-dashboard/model"
	"sort"

	"github.com/larscom/gitlab-ci-dashboard/config"
)

type Service interface {
	GetGroups() []model.Group
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

func (s *ServiceImpl) GetGroups() []model.Group {
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
