package group

import (
	"fmt"
	"sort"

	"github.com/larscom/gitlab-ci-dashboard/config"
	"github.com/rs/zerolog"

	"github.com/xanzy/go-gitlab"
)

type GroupService struct {
	client *gitlab.Client
	config *config.GitlabConfig
	logger zerolog.Logger
}

func NewGroupService(client *gitlab.Client, logger zerolog.Logger, config *config.GitlabConfig) *GroupService {
	return &GroupService{
		client: client,
		config: config,
		logger: logger,
	}
}

func (g *GroupService) GetGroups() []*gitlab.Group {
	if len(*g.config.GitlabGroupOnlyIds) > 0 {
		return g.getGroupsById(*g.config.GitlabGroupOnlyIds)
	}
	return g.getAllGroups()
}

func (g *GroupService) getAllGroups() []*gitlab.Group {
	groups, resp, err := g.client.Groups.ListGroups(g.createListGroupOptions(1))
	if err != nil {
		g.logger.
			Warn().
			Int("status", resp.StatusCode).
			Err(err).
			Msg("Error while retrieving groups")
		return make([]*gitlab.Group, 0)
	}
	if resp.NextPage == 0 || resp.TotalPages == 0 {
		return groups
	}

	capacity := resp.TotalPages - 1
	jobs := make(chan int, capacity)
	results := make(chan []*gitlab.Group, capacity)

	for page := resp.NextPage; page <= resp.TotalPages; page++ {
		go g.pageProcessor(jobs, results)
		jobs <- page
	}
	close(jobs)

	for i := 0; i < capacity; i++ {
		groups = append(groups, <-results...)
	}

	return groups
}

func (g *GroupService) getGroupsById(groupIds []int) []*gitlab.Group {
	jobs := make(chan int, len(groupIds))
	results := make(chan *gitlab.Group, len(groupIds))

	for _, groupId := range groupIds {
		go g.groupIdProcessor(jobs, results, &gitlab.GetGroupOptions{WithProjects: gitlab.Bool(false)})
		jobs <- groupId
	}
	close(jobs)

	groups := []*gitlab.Group{}
	for range groupIds {
		result := <-results
		if result != nil {
			groups = append(groups, result)
		}
	}

	sort.Slice(groups[:], func(i, j int) bool {
		return groups[i].Name < groups[j].Name
	})

	return groups
}

func (g *GroupService) groupIdProcessor(groupIds <-chan int, result chan<- *gitlab.Group, options *gitlab.GetGroupOptions) {
	for groupId := range groupIds {
		group, resp, err := g.client.Groups.GetGroup(groupId, options)
		if err != nil {
			g.logger.
				Warn().
				Int("status", resp.StatusCode).
				Err(err).
				Msg(fmt.Sprintf("Error while retrieving group with id: %d", groupId))
			result <- nil
		} else {
			result <- group
		}
	}
}

func (g *GroupService) pageProcessor(pageNumbers <-chan int, result chan<- []*gitlab.Group) {
	for pageNumber := range pageNumbers {
		groups, resp, err := g.client.Groups.ListGroups(g.createListGroupOptions(pageNumber))
		if err != nil {
			g.logger.
				Warn().
				Int("status", resp.StatusCode).
				Err(err).
				Msg("Error while retrieving groups")
			result <- make([]*gitlab.Group, 0)
		} else {
			result <- groups
		}
	}
}

func (g *GroupService) createListGroupOptions(pageNumber int) *gitlab.ListGroupsOptions {
	return &gitlab.ListGroupsOptions{
		ListOptions: gitlab.ListOptions{
			Page:    pageNumber,
			PerPage: 100,
		},
		TopLevelOnly: &g.config.GitlabGroupOnlyTopLevel,
		SkipGroups:   g.config.GitlabGroupSkipIds,
	}
}
