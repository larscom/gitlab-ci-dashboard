package group

import (
	"context"
	"sort"

	"github.com/larscom/gitlab-ci-dashboard/model"

	"github.com/larscom/gitlab-ci-dashboard/config"
)

type GroupService interface {
	GetGroups(ctx context.Context) ([]model.Group, error)
}

type groupService struct {
	config *config.GitlabConfig
	client GroupClient
}

func NewService(config *config.GitlabConfig, client GroupClient) GroupService {
	return &groupService{
		config: config,
		client: client,
	}
}

func (s *groupService) GetGroups(ctx context.Context) ([]model.Group, error) {
	if len(s.config.GroupOnlyIds) > 0 {
		groups, err := s.client.GetGroupsById(s.config.GroupOnlyIds, ctx)
		return sortByName(groups), err
	}
	groups, err := s.client.GetGroups(ctx)
	return sortByName(groups), err
}

func sortByName(groups []model.Group) []model.Group {
	sort.SliceStable(groups[:], func(i, j int) bool {
		return groups[i].Name < groups[j].Name
	})
	return groups
}
