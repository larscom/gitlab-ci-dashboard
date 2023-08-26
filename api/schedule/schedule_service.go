package schedule

import (
	"github.com/larscom/gitlab-ci-dashboard/data"
	"github.com/larscom/gitlab-ci-dashboard/pipeline"
	"github.com/larscom/go-cache"
	"sort"
	"sync"
)

type Service interface {
	GetSchedules(groupId int) []data.ScheduleWithProjectAndPipeline
}

type ServiceImpl struct {
	projectsLoader       cache.Cache[int, []data.Project]
	schedulesLoader      cache.Cache[int, []data.Schedule]
	pipelineLatestLoader cache.Cache[pipeline.Key, *data.Pipeline]
}

func NewService(
	projectsLoader cache.Cache[int, []data.Project],
	schedulesLoader cache.Cache[int, []data.Schedule],
	pipelineLatestLoader cache.Cache[pipeline.Key, *data.Pipeline],
) Service {
	return &ServiceImpl{
		projectsLoader,
		schedulesLoader,
		pipelineLatestLoader,
	}
}

func (s *ServiceImpl) GetSchedules(groupId int) []data.ScheduleWithProjectAndPipeline {
	projects, _ := s.projectsLoader.Get(groupId)

	chn := make(chan []data.ScheduleWithProjectAndPipeline, 20)

	var wg sync.WaitGroup
	for _, project := range projects {
		wg.Add(1)
		go s.getSchedules(project, &wg, chn)
	}

	go func() {
		defer close(chn)
		wg.Wait()
	}()

	schedules := make([]data.ScheduleWithProjectAndPipeline, 0)
	for value := range chn {
		schedules = append(schedules, value...)
	}

	return sortById(schedules)
}

func (s *ServiceImpl) getSchedules(project data.Project, wg *sync.WaitGroup, chn chan<- []data.ScheduleWithProjectAndPipeline) {
	defer wg.Done()

	schedules, _ := s.schedulesLoader.Get(project.Id)

	result := make([]data.ScheduleWithProjectAndPipeline, 0, len(schedules))
	for _, schedule := range schedules {
		source := "schedule"
		pipeline, _ := s.pipelineLatestLoader.Get(pipeline.NewPipelineKey(project.Id, schedule.Ref, &source))

		result = append(result, data.ScheduleWithProjectAndPipeline{
			Schedule: schedule,
			Project:  project,
			Pipeline: pipeline,
		})
	}

	chn <- result
}

func sortById(schedules []data.ScheduleWithProjectAndPipeline) []data.ScheduleWithProjectAndPipeline {
	sort.SliceStable(schedules[:], func(i, j int) bool {
		return schedules[i].Schedule.Id < schedules[j].Schedule.Id
	})
	return schedules
}
