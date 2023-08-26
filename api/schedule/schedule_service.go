package schedule

import (
	"github.com/larscom/gitlab-ci-dashboard/pipeline"
	"sort"
	"sync"

	"github.com/larscom/gitlab-ci-dashboard/model"
	"github.com/larscom/go-cache"
)

type Service interface {
	GetSchedules(groupId int) []model.ScheduleWithProjectAndPipeline
}

type ServiceImpl struct {
	projectsLoader       cache.Cache[model.GroupId, []model.Project]
	schedulesLoader      cache.Cache[model.ProjectId, []model.Schedule]
	pipelineLatestLoader cache.Cache[pipeline.Key, *model.Pipeline]
}

func NewService(
	projectsLoader cache.Cache[model.GroupId, []model.Project],
	schedulesLoader cache.Cache[model.ProjectId, []model.Schedule],
	pipelineLatestLoader cache.Cache[pipeline.Key, *model.Pipeline],
) Service {
	return &ServiceImpl{
		projectsLoader,
		schedulesLoader,
		pipelineLatestLoader,
	}
}

func (s *ServiceImpl) GetSchedules(groupId int) []model.ScheduleWithProjectAndPipeline {
	projects, _ := s.projectsLoader.Get(model.GroupId(groupId))

	chn := make(chan []model.ScheduleWithProjectAndPipeline, 20)

	var wg sync.WaitGroup
	for _, project := range projects {
		wg.Add(1)
		go s.getSchedules(project, &wg, chn)
	}

	go func() {
		defer close(chn)
		wg.Wait()
	}()

	schedules := make([]model.ScheduleWithProjectAndPipeline, 0)
	for value := range chn {
		schedules = append(schedules, value...)
	}

	return sortById(schedules)
}

func (s *ServiceImpl) getSchedules(project model.Project, wg *sync.WaitGroup, chn chan<- []model.ScheduleWithProjectAndPipeline) {
	defer wg.Done()

	schedules, _ := s.schedulesLoader.Get(model.ProjectId(project.Id))

	result := make([]model.ScheduleWithProjectAndPipeline, 0, len(schedules))
	for _, schedule := range schedules {
		source := "schedule"
		pipeline, _ := s.pipelineLatestLoader.Get(pipeline.NewPipelineKey(project.Id, schedule.Ref, &source))

		result = append(result, model.ScheduleWithProjectAndPipeline{
			Schedule: schedule,
			Project:  project,
			Pipeline: pipeline,
		})
	}

	chn <- result
}

func sortById(schedules []model.ScheduleWithProjectAndPipeline) []model.ScheduleWithProjectAndPipeline {
	sort.SliceStable(schedules[:], func(i, j int) bool {
		return schedules[i].Schedule.Id < schedules[j].Schedule.Id
	})
	return schedules
}
