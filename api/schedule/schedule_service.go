package schedule

import (
	"github.com/larscom/gitlab-ci-dashboard/model"
	"github.com/larscom/gitlab-ci-dashboard/pipeline"
	"github.com/larscom/go-cache"
	"sort"
	"sync"
)

type Service interface {
	GetSchedules(groupId int) ([]model.ScheduleWithProjectAndPipeline, error)
}

type ServiceImpl struct {
	projectsLoader       cache.Cache[int, []model.Project]
	schedulesLoader      cache.Cache[int, []model.Schedule]
	pipelineLatestLoader cache.Cache[pipeline.Key, *model.Pipeline]
}

func NewService(
	projectsLoader cache.Cache[int, []model.Project],
	schedulesLoader cache.Cache[int, []model.Schedule],
	pipelineLatestLoader cache.Cache[pipeline.Key, *model.Pipeline],
) Service {
	return &ServiceImpl{
		projectsLoader,
		schedulesLoader,
		pipelineLatestLoader,
	}
}

func (s *ServiceImpl) GetSchedules(groupId int) ([]model.ScheduleWithProjectAndPipeline, error) {
	result := make([]model.ScheduleWithProjectAndPipeline, 0)

	projects, err := s.projectsLoader.Get(groupId)
	if err != nil {
		return result, err
	}

	var (
		chn    = make(chan []model.ScheduleWithProjectAndPipeline, len(projects))
		errchn = make(chan error)
		wg     sync.WaitGroup
	)

	for _, project := range projects {
		wg.Add(1)
		go s.getSchedules(project, &wg, chn, errchn)
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
		result = append(result, value...)
	}

	return sortById(result), nil
}

func (s *ServiceImpl) getSchedules(
	project model.Project,
	wg *sync.WaitGroup,
	chn chan<- []model.ScheduleWithProjectAndPipeline,
	errchn chan<- error,
) {
	defer wg.Done()

	schedules, err := s.schedulesLoader.Get(project.Id)
	if err != nil {
		errchn <- err
	} else {
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
}

func sortById(schedules []model.ScheduleWithProjectAndPipeline) []model.ScheduleWithProjectAndPipeline {
	sort.SliceStable(schedules[:], func(i, j int) bool {
		return schedules[i].Schedule.Id < schedules[j].Schedule.Id
	})
	return schedules
}
