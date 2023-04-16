package schedule

import (
	"github.com/larscom/gitlab-ci-dashboard/model"
	"github.com/larscom/go-cache"
)

type ScheduleService interface {
	GetSchedules(groupId int) []model.Schedule
}

type ScheduleServiceImpl struct {
	projectLoader        cache.Cache[model.GroupId, []*model.Project]
	scheduleLoader       cache.Cache[model.ProjectId, []*model.Schedule]
	pipelineLatestLoader cache.Cache[model.PipelineKey, *model.Pipeline]
}

func NewScheduleService(
	projectLoader cache.Cache[model.GroupId, []*model.Project],
	scheduleLoader cache.Cache[model.ProjectId, []*model.Schedule],
	pipelineLatestLoader cache.Cache[model.PipelineKey, *model.Pipeline],
) ScheduleService {
	return &ScheduleServiceImpl{
		projectLoader,
		scheduleLoader,
		pipelineLatestLoader,
	}
}

func (s *ScheduleServiceImpl) GetSchedules(groupId int) []model.Schedule {
	projects, _ := s.projectLoader.Get(model.GroupId(groupId))

	chn := make(chan []model.Schedule, len(projects))
	for _, project := range projects {
		go s.getSchedules(*project, chn)
	}

	schedules := make([]model.Schedule, 0)
	for i := 0; i < len(projects); i++ {
		schedules = append(schedules, <-chn...)
	}

	close(chn)

	return schedules
}

func (s *ScheduleServiceImpl) getSchedules(project model.Project, chn chan<- []model.Schedule) {
	schedules, _ := s.scheduleLoader.Get(model.ProjectId(project.Id))

	result := make([]model.Schedule, 0, len(schedules))
	for _, schedule := range schedules {
		cp := *schedule
		cp.Project = project

		source := "schedule"
		pipeline, _ := s.pipelineLatestLoader.Get(model.NewPipelineKey(project.Id, cp.Ref, &source))
		if pipeline != nil {
			cp.PipelineStatus = pipeline.Status
		} else {
			cp.PipelineStatus = "unknown"
		}

		result = append(result, cp)
	}

	chn <- result
}
