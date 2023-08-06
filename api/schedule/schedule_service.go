package schedule

import (
	"sort"

	"github.com/larscom/gitlab-ci-dashboard/model"
	"github.com/larscom/go-cache"
)

type ScheduleService interface {
	GetSchedules(groupId int) []model.ScheduleWithProjectAndPipeline
}

type ScheduleServiceImpl struct {
	projectLoader        cache.Cache[model.GroupId, []model.Project]
	scheduleLoader       cache.Cache[model.ProjectId, []model.Schedule]
	pipelineLatestLoader cache.Cache[model.PipelineKey, *model.Pipeline]
}

func NewScheduleService(
	projectLoader cache.Cache[model.GroupId, []model.Project],
	scheduleLoader cache.Cache[model.ProjectId, []model.Schedule],
	pipelineLatestLoader cache.Cache[model.PipelineKey, *model.Pipeline],
) ScheduleService {
	return &ScheduleServiceImpl{
		projectLoader,
		scheduleLoader,
		pipelineLatestLoader,
	}
}

func (s *ScheduleServiceImpl) GetSchedules(groupId int) []model.ScheduleWithProjectAndPipeline {
	projects, _ := s.projectLoader.Get(model.GroupId(groupId))

	chn := make(chan []model.ScheduleWithProjectAndPipeline, len(projects))
	for _, project := range projects {
		go s.getSchedules(project, chn)
	}

	schedules := make([]model.ScheduleWithProjectAndPipeline, 0)
	for i := 0; i < len(projects); i++ {
		schedules = append(schedules, <-chn...)
	}

	close(chn)

	return sortById(schedules)
}

func (s *ScheduleServiceImpl) getSchedules(project model.Project, chn chan<- []model.ScheduleWithProjectAndPipeline) {
	schedules, _ := s.scheduleLoader.Get(model.ProjectId(project.Id))

	result := make([]model.ScheduleWithProjectAndPipeline, 0, len(schedules))
	for _, schedule := range schedules {
		source := "schedule"
		pipeline, _ := s.pipelineLatestLoader.Get(model.NewPipelineKey(project.Id, schedule.Ref, &source))

		result = append(result, model.ScheduleWithProjectAndPipeline{
			Schedule:       schedule,
			Project:        project,
			LatestPipeline: pipeline,
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
