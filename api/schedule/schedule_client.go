package schedule

import (
	"github.com/larscom/gitlab-ci-dashboard/model"
	"github.com/larscom/gitlab-ci-dashboard/util"
	"github.com/xanzy/go-gitlab"
	"golang.org/x/net/context"
	"golang.org/x/sync/errgroup"
)

type ScheduleClient interface {
	GetPipelineSchedules(projectId int, ctx context.Context) ([]model.Schedule, error)
}

type scheduleClient struct {
	gitlab GitlabClient
}

func NewClient(gitlab GitlabClient) ScheduleClient {
	return &scheduleClient{
		gitlab: gitlab,
	}
}

func (c *scheduleClient) GetPipelineSchedules(projectId int, ctx context.Context) ([]model.Schedule, error) {
	schedules, response, err := c.gitlab.ListPipelineSchedules(projectId, createOptions(1))
	if err != nil {
		return schedules, err
	}
	if response.NextPage == 0 || response.TotalPages <= 1 {
		return schedules, nil
	}

	var (
		resultchn = make(chan []model.Schedule, util.GetMaxChanCapacity(response.TotalPages))
		g, gctx   = errgroup.WithContext(ctx)
	)

	for page := response.NextPage; page <= response.TotalPages; page++ {
		run := util.CreateRunFunc(c.getSchedulesByPage, resultchn, gctx)
		g.Go(run(schedulePageArgs{
			projectId:  projectId,
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
	projectId  int
	pageNumber int
}

func (c *scheduleClient) getSchedulesByPage(args schedulePageArgs) ([]model.Schedule, error) {
	schedules, _, err := c.gitlab.ListPipelineSchedules(args.projectId, createOptions(args.pageNumber))
	return schedules, err
}

func createOptions(pageNumber int) *gitlab.ListPipelineSchedulesOptions {
	return &gitlab.ListPipelineSchedulesOptions{
		Page:    pageNumber,
		PerPage: 100,
	}
}
