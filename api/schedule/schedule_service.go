package schedule

import (
	"sort"

	"github.com/larscom/gitlab-ci-dashboard/model"
	"github.com/larscom/go-cache"
)

type ScheduleService interface {
	GetSchedules(groupId int) []*model.Schedule
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

func (s *ScheduleServiceImpl) GetSchedules(groupId int) []*model.Schedule {
	projects, _ := s.projectLoader.Get(model.GroupId(groupId))

	chn := make(chan []*model.Schedule, len(projects))
	for _, project := range projects {
		go s.getSchedules(*project, chn)
	}

	schedules := make([]*model.Schedule, 0)
	for i := 0; i < len(projects); i++ {
		schedules = append(schedules, <-chn...)
	}

	close(chn)

	return sortById(schedules)
}

func (s *ScheduleServiceImpl) getSchedules(project model.Project, chn chan<- []*model.Schedule) {
	schedules, _ := s.scheduleLoader.Get(model.ProjectId(project.Id))

	result := make([]*model.Schedule, 0, len(schedules))
	for _, schedule := range schedules {
		c := *schedule
		c.Project = project

		source := "schedule"
		pipeline, _ := s.pipelineLatestLoader.Get(model.NewPipelineKey(project.Id, c.Ref, &source))
		if pipeline != nil {
			c.PipelineStatus = pipeline.Status
		} else {
			c.PipelineStatus = "unknown"
		}

		result = append(result, &c)
	}

	chn <- result
}

func sortById(schedules []*model.Schedule) []*model.Schedule {
	sort.SliceStable(schedules[:], func(i, j int) bool {
		return schedules[i].Id < schedules[j].Id
	})
	return schedules
}
