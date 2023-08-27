package group

import (
	"github.com/larscom/gitlab-ci-dashboard/model"
	"sync"

	"github.com/larscom/gitlab-ci-dashboard/config"

	"github.com/xanzy/go-gitlab"
)

type Client interface {
	GetGroups() ([]model.Group, error)

	GetGroupsById(ids []int) ([]model.Group, error)
}

type ClientImpl struct {
	client GitlabClient
	config *config.GitlabConfig
}

func NewClient(client GitlabClient, config *config.GitlabConfig) Client {
	return &ClientImpl{
		client,
		config,
	}
}

func (c *ClientImpl) GetGroupsById(ids []int) ([]model.Group, error) {
	var (
		chn    = make(chan *model.Group, len(ids))
		errchn = make(chan error)
		result = make([]model.Group, 0)
		wg     sync.WaitGroup
	)

	for _, groupId := range ids {
		wg.Add(1)
		go c.getGroupById(groupId, &wg, chn, errchn)
	}

	go func() {
		defer close(errchn)
		defer close(chn)
		wg.Wait()
	}()

	if e := <-errchn; e != nil {
		return result, e
	}

	for value := range chn {
		if value != nil {
			result = append(result, *value)
		}
	}

	return result, nil
}

func (c *ClientImpl) GetGroups() ([]model.Group, error) {
	groups, response, err := c.client.ListGroups(c.createOptions(1))
	if err != nil {
		return groups, err
	}
	if response.NextPage == 0 || response.TotalPages <= 1 {
		return groups, nil
	}

	var (
		chn    = make(chan []model.Group, response.TotalPages)
		errchn = make(chan error)
		wg     sync.WaitGroup
	)

	for page := response.NextPage; page <= response.TotalPages; page++ {
		wg.Add(1)
		go c.getGroupsByPage(page, &wg, chn, errchn)
	}

	go func() {
		defer close(errchn)
		defer close(chn)
		wg.Wait()
	}()

	if e := <-errchn; e != nil {
		return groups, e
	}

	for value := range chn {
		groups = append(groups, value...)
	}

	return groups, nil
}

func (c *ClientImpl) getGroupsByPage(
	pageNumber int,
	wg *sync.WaitGroup,
	chn chan<- []model.Group,
	errchn chan<- error,
) {
	defer wg.Done()

	groups, _, err := c.client.ListGroups(c.createOptions(pageNumber))
	if err != nil {
		errchn <- err
	} else {
		chn <- groups
	}
}

func (c *ClientImpl) getGroupById(
	groupId int,
	wg *sync.WaitGroup,
	chn chan<- *model.Group,
	errchn chan<- error,
) {
	defer wg.Done()

	group, _, err := c.client.GetGroup(groupId, &gitlab.GetGroupOptions{WithProjects: gitlab.Bool(false)})
	if err != nil {
		errchn <- err
	} else {
		chn <- group
	}
}

func (c *ClientImpl) createOptions(pageNumber int) *gitlab.ListGroupsOptions {
	return &gitlab.ListGroupsOptions{
		ListOptions: gitlab.ListOptions{
			Page:    pageNumber,
			PerPage: 100,
		},
		SkipGroups:   &c.config.GroupSkipIds,
		TopLevelOnly: &c.config.GroupOnlyTopLevel,
	}
}
