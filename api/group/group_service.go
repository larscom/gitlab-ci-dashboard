package group

import (
	"github.com/larscom/gitlab-ci-dashboard/model"
	"sort"

	"github.com/larscom/gitlab-ci-dashboard/config"
)

type Service interface {
	GetGroups() ([]model.Group, error)
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

func (s *ServiceImpl) GetGroups() ([]model.Group, error) {
	if len(s.config.GroupOnlyIds) > 0 {
		groups, err := s.client.GetGroupsById(s.config.GroupOnlyIds)
		return sortByName(groups), err
	}
	groups, err := s.client.GetGroups()
	return sortByName(groups), err
}

func sortByName(groups []model.Group) []model.Group {
	sort.SliceStable(groups[:], func(i, j int) bool {
		return groups[i].Name < groups[j].Name
	})
	return groups
}
