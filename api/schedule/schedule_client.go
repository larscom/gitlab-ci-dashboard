package schedule

import (
	"github.com/larscom/gitlab-ci-dashboard/data"
	"sync"

	"github.com/xanzy/go-gitlab"
)

type Client interface {
	GetPipelineSchedules(projectId int) []data.Schedule
}

type ClientImpl struct {
	client GitlabClient
}

func NewClient(client GitlabClient) Client {
	return &ClientImpl{
		client,
	}
}

func (c *ClientImpl) GetPipelineSchedules(projectId int) []data.Schedule {
	schedules, response, err := c.client.ListPipelineSchedules(projectId, createOptions(1))
	if err != nil {
		return schedules
	}
	if response.NextPage == 0 || response.TotalPages <= 1 {
		return schedules
	}

	chn := make(chan []data.Schedule, response.TotalPages)

	var wg sync.WaitGroup
	for page := response.NextPage; page <= response.TotalPages; page++ {
		wg.Add(1)
		go c.getSchedulesByPage(projectId, &wg, page, chn)
	}

	go func() {
		defer close(chn)
		wg.Wait()
	}()

	for value := range chn {
		schedules = append(schedules, value...)
	}

	return schedules
}

func (c *ClientImpl) getSchedulesByPage(projectId int, wg *sync.WaitGroup, pageNumber int, chn chan<- []data.Schedule) {
	defer wg.Done()
	schedules, _, _ := c.client.ListPipelineSchedules(projectId, createOptions(pageNumber))
	chn <- schedules
}

func createOptions(pageNumber int) *gitlab.ListPipelineSchedulesOptions {
	return &gitlab.ListPipelineSchedulesOptions{
		Page:    pageNumber,
		PerPage: 100,
	}
}
