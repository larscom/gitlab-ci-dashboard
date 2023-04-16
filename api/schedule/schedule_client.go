package schedule

import (
	"github.com/larscom/gitlab-ci-dashboard/client"
	"github.com/larscom/gitlab-ci-dashboard/config"
	"github.com/larscom/gitlab-ci-dashboard/model"
	"github.com/xanzy/go-gitlab"
)

type ScheduleClient interface {
	GetPipelineSchedules(projectId int) []*model.Schedule
}

type ScheduleClientImpl struct {
	client client.GitlabClient
	config *config.GitlabConfig
}

func NewScheduleClient(client client.GitlabClient, config *config.GitlabConfig) ScheduleClient {
	return &ScheduleClientImpl{client, config}
}

func (c *ScheduleClientImpl) GetPipelineSchedules(projectId int) []*model.Schedule {
	schedules, response, err := c.client.ListPipelineSchedules(projectId, c.createOptions(1))
	if err != nil {
		return schedules
	}
	if response.NextPage == 0 || response.TotalPages <= 1 {
		return schedules
	}

	capacity := response.TotalPages - 1
	chn := make(chan []*model.Schedule, capacity)

	for page := response.NextPage; page <= response.TotalPages; page++ {
		go c.getSchedulesByPage(projectId, page, chn)
	}

	for i := 0; i < capacity; i++ {
		schedules = append(schedules, <-chn...)
	}

	close(chn)

	return schedules
}

func (c *ScheduleClientImpl) getSchedulesByPage(projectId int, pageNumber int, chn chan<- []*model.Schedule) {
	schedules, _, _ := c.client.ListPipelineSchedules(projectId, c.createOptions(pageNumber))
	chn <- schedules
}

func (c *ScheduleClientImpl) createOptions(pageNumber int) *gitlab.ListPipelineSchedulesOptions {
	return &gitlab.ListPipelineSchedulesOptions{
		Page:    pageNumber,
		PerPage: 100,
	}
}
