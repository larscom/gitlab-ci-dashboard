package schedule

import (
	"github.com/larscom/gitlab-ci-dashboard/pipeline"
	"github.com/larscom/gitlab-ci-dashboard/project"
	"github.com/larscom/go-cache"
	"sort"
	"sync"
)

type ScheduleWithProjectAndPipeline struct {
	Schedule Schedule           `json:"schedule"`
	Project  project.Project    `json:"project"`
	Pipeline *pipeline.Pipeline `json:"pipeline"`
}

type Service interface {
	GetSchedules(groupId int) []ScheduleWithProjectAndPipeline
}

type ServiceImpl struct {
	projectsLoader       cache.Cache[int, []project.Project]
	schedulesLoader      cache.Cache[int, []Schedule]
	pipelineLatestLoader cache.Cache[pipeline.Key, *pipeline.Pipeline]
}

func NewService(
	projectsLoader cache.Cache[int, []project.Project],
	schedulesLoader cache.Cache[int, []Schedule],
	pipelineLatestLoader cache.Cache[pipeline.Key, *pipeline.Pipeline],
) Service {
	return &ServiceImpl{
		projectsLoader,
		schedulesLoader,
		pipelineLatestLoader,
	}
}

func (s *ServiceImpl) GetSchedules(groupId int) []ScheduleWithProjectAndPipeline {
	projects, _ := s.projectsLoader.Get(groupId)

	chn := make(chan []ScheduleWithProjectAndPipeline, 20)

	var wg sync.WaitGroup
	for _, project := range projects {
		wg.Add(1)
		go s.getSchedules(project, &wg, chn)
	}

	go func() {
		defer close(chn)
		wg.Wait()
	}()

	schedules := make([]ScheduleWithProjectAndPipeline, 0)
	for value := range chn {
		schedules = append(schedules, value...)
	}

	return sortById(schedules)
}

func (s *ServiceImpl) getSchedules(project project.Project, wg *sync.WaitGroup, chn chan<- []ScheduleWithProjectAndPipeline) {
	defer wg.Done()

	schedules, _ := s.schedulesLoader.Get(project.Id)

	result := make([]ScheduleWithProjectAndPipeline, 0, len(schedules))
	for _, schedule := range schedules {
		source := "schedule"
		pipeline, _ := s.pipelineLatestLoader.Get(pipeline.NewPipelineKey(project.Id, schedule.Ref, &source))

		result = append(result, ScheduleWithProjectAndPipeline{
			Schedule: schedule,
			Project:  project,
			Pipeline: pipeline,
		})
	}

	chn <- result
}

func sortById(schedules []ScheduleWithProjectAndPipeline) []ScheduleWithProjectAndPipeline {
	sort.SliceStable(schedules[:], func(i, j int) bool {
		return schedules[i].Schedule.Id < schedules[j].Schedule.Id
	})
	return schedules
}
