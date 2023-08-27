package schedule

import (
  "github.com/larscom/gitlab-ci-dashboard/model"
  "sync"

  "github.com/xanzy/go-gitlab"
)

type Client interface {
  GetPipelineSchedules(projectId int) ([]model.Schedule, error)
}

type ClientImpl struct {
  client GitlabClient
}

func NewClient(client GitlabClient) Client {
  return &ClientImpl{
    client,
  }
}

func (c *ClientImpl) GetPipelineSchedules(projectId int) ([]model.Schedule, error) {
  schedules, response, err := c.client.ListPipelineSchedules(projectId, createOptions(1))
  if err != nil {
    return schedules, err
  }
  if response.NextPage == 0 || response.TotalPages <= 1 {
    return schedules, nil
  }

  var (
    chn    = make(chan []model.Schedule, response.TotalPages)
    errchn = make(chan error)
    wg     sync.WaitGroup
  )

  for page := response.NextPage; page <= response.TotalPages; page++ {
    wg.Add(1)
    go c.getSchedulesByPage(projectId, &wg, page, chn, errchn)
  }

  go func() {
    defer close(errchn)
    defer close(chn)
    wg.Wait()
  }()

  if e := <-errchn; e != nil {
    return schedules, e
  }

  for value := range chn {
    schedules = append(schedules, value...)
  }

  return schedules, nil
}

func (c *ClientImpl) getSchedulesByPage(
  projectId int,
  wg *sync.WaitGroup,
  pageNumber int,
  chn chan<- []model.Schedule,
  errchn chan<- error,
) {
  defer wg.Done()

  schedules, _, err := c.client.ListPipelineSchedules(projectId, createOptions(pageNumber))
  if err != nil {
    errchn <- err
  } else {
    chn <- schedules
  }
}

func createOptions(pageNumber int) *gitlab.ListPipelineSchedulesOptions {
  return &gitlab.ListPipelineSchedulesOptions{
    Page:    pageNumber,
    PerPage: 100,
  }
}
