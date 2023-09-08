package schedule

import (
	"github.com/larscom/gitlab-ci-dashboard/model"
	"github.com/larscom/gitlab-ci-dashboard/util"
	"github.com/xanzy/go-gitlab"
	"golang.org/x/net/context"
	"golang.org/x/sync/errgroup"
)

type Client interface {
	GetPipelineSchedules(model.ProjectId) ([]model.Schedule, error)
}

type ClientImpl struct {
	client GitlabClient
}

func NewClient(client GitlabClient) Client {
	return &ClientImpl{
		client,
	}
}

func (c *ClientImpl) GetPipelineSchedules(id model.ProjectId) ([]model.Schedule, error) {
	schedules, response, err := c.client.ListPipelineSchedules(id, createOptions(1))
	if err != nil {
		return schedules, err
	}
	if response.NextPage == 0 || response.TotalPages <= 1 {
		return schedules, nil
	}

	var (
		resultchn = make(chan []model.Schedule, util.GetMaxChanCapacity(response.TotalPages))
		g, ctx    = errgroup.WithContext(context.Background())
	)

	for page := response.NextPage; page <= response.TotalPages; page++ {
		run := util.CreateRunFunc[schedulePageArgs, []model.Schedule](c.getSchedulesByPage, resultchn, ctx)
		g.Go(run(schedulePageArgs{
			projectId:  id,
			pageNumber: page,
		}))
	}

	go func() {
		defer close(resultchn)
		g.Wait()
	}()

	for value := range resultchn {
		schedules = append(schedules, value...)
	}

	return schedules, g.Wait()
}

type schedulePageArgs struct {
	projectId  model.ProjectId
	pageNumber int
}

func (c *ClientImpl) getSchedulesByPage(args schedulePageArgs) ([]model.Schedule, error) {
	schedules, _, err := c.client.ListPipelineSchedules(args.projectId, createOptions(args.pageNumber))
	return schedules, err
}

func createOptions(pageNumber int) *gitlab.ListPipelineSchedulesOptions {
	return &gitlab.ListPipelineSchedulesOptions{
		Page:    pageNumber,
		PerPage: 100,
	}
}
