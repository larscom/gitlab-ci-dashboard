package group

import (
	"sort"

	"github.com/larscom/gitlab-ci-dashboard/config"
	"github.com/larscom/gitlab-ci-dashboard/model"

	"github.com/xanzy/go-gitlab"
)

type GroupService struct {
	client *gitlab.Client
	config *config.AppConfig
}

type GroupIdProcessorResult struct {
	group *gitlab.Group
	err   *model.Error
}

type GroupPageProcessorResult struct {
	groups []*gitlab.Group
	err    *model.Error
}

func NewGroupService(client *gitlab.Client, config *config.AppConfig) *GroupService {
	return &GroupService{
		client: client,
		config: config,
	}
}

func (g *GroupService) GetGroups() ([]*gitlab.Group, *model.Error) {
	if len(g.config.GitlabGroupOnlyIds) > 0 {
		return g.getGroupsById(g.config.GitlabGroupOnlyIds)
	}
	return g.getAllGroups()
}

func (g *GroupService) getAllGroups() ([]*gitlab.Group, *model.Error) {
	groups, resp, err := g.client.Groups.ListGroups(g.createListGroupOptions(1))
	if err != nil {
		return nil, model.NewError(resp.StatusCode, resp.Status)
	}
	if resp.NextPage == 0 || resp.TotalPages == 0 {
		return groups, nil
	}

	capacity := resp.TotalPages - 1
	jobs := make(chan int, capacity)
	results := make(chan *GroupPageProcessorResult, capacity)

	for page := resp.NextPage; page <= resp.TotalPages; page++ {
		go g.pageProcessor(jobs, results)
		jobs <- page
	}
	close(jobs)

	for i := 0; i < capacity; i++ {
		result := <-results
		if result.err != nil {
			return nil, result.err
		}
		groups = append(groups, result.groups...)
	}

	return groups, nil
}

func (g *GroupService) getGroupsById(groupIds []int) ([]*gitlab.Group, *model.Error) {
	jobs := make(chan int, len(groupIds))
	results := make(chan *GroupIdProcessorResult, len(groupIds))

	for _, groupId := range groupIds {
		go g.groupIdProcessor(jobs, results, &gitlab.GetGroupOptions{WithProjects: gitlab.Bool(false)})
		jobs <- groupId
	}
	close(jobs)

	groups := []*gitlab.Group{}
	for range groupIds {
		result := <-results
		if result.err != nil {
			return nil, result.err
		}
		groups = append(groups, result.group)
	}

	sort.Slice(groups[:], func(i, j int) bool {
		return groups[i].Name < groups[j].Name
	})

	return groups, nil
}

func (g *GroupService) groupIdProcessor(groupIds <-chan int, result chan<- *GroupIdProcessorResult, options *gitlab.GetGroupOptions) {
	for groupId := range groupIds {
		group, resp, err := g.client.Groups.GetGroup(groupId, options)
		if err != nil {
			result <- &GroupIdProcessorResult{err: model.NewError(resp.StatusCode, resp.Status)}
		} else {
			result <- &GroupIdProcessorResult{group: group}
		}
	}
}

func (g *GroupService) pageProcessor(pageNumbers <-chan int, result chan<- *GroupPageProcessorResult) {
	for pageNumber := range pageNumbers {
		groups, resp, err := g.client.Groups.ListGroups(g.createListGroupOptions(pageNumber))
		if err != nil {
			result <- &GroupPageProcessorResult{err: model.NewError(resp.StatusCode, resp.Status)}
		} else {
			result <- &GroupPageProcessorResult{groups: groups}
		}
	}
}

func (g *GroupService) createListGroupOptions(pageNumber int) *gitlab.ListGroupsOptions {
	return &gitlab.ListGroupsOptions{
		ListOptions: gitlab.ListOptions{
			Page:    pageNumber,
			PerPage: 100,
		},
		TopLevelOnly: gitlab.Bool(g.config.GitlabGroupOnlyTopLevel),
		SkipGroups:   &g.config.GitlabGroupSkipIds,
	}
}
