package schedule

import (
	"sort"

	"github.com/bobg/go-generics/v2/slices"
	"github.com/larscom/gitlab-ci-dashboard/config"
	"github.com/larscom/gitlab-ci-dashboard/model"
	"github.com/larscom/gitlab-ci-dashboard/pipeline"
	"github.com/larscom/gitlab-ci-dashboard/util"
	ldgc "github.com/larscom/go-loading-cache"
	"golang.org/x/net/context"
	"golang.org/x/sync/errgroup"
)

type ScheduleService interface {
	GetSchedules(groupId int, ctx context.Context) ([]model.ScheduleProjectLatestPipeline, error)
}

type scheduleService struct {
	config               *config.GitlabConfig
	projectsLoader       ldgc.LoadingCache[int, []model.Project]
	schedulesLoader      ldgc.LoadingCache[int, []model.Schedule]
	pipelineLatestLoader ldgc.LoadingCache[pipeline.Key, *model.Pipeline]
}

func NewService(
	config *config.GitlabConfig,
	projectsLoader ldgc.LoadingCache[int, []model.Project],
	schedulesLoader ldgc.LoadingCache[int, []model.Schedule],
	pipelineLatestLoader ldgc.LoadingCache[pipeline.Key, *model.Pipeline],
) ScheduleService {
	return &scheduleService{
		config:               config,
		projectsLoader:       projectsLoader,
		schedulesLoader:      schedulesLoader,
		pipelineLatestLoader: pipelineLatestLoader,
	}
}

func (s *scheduleService) GetSchedules(groupId int, ctx context.Context) ([]model.ScheduleProjectLatestPipeline, error) {
	projects, err := s.projectsLoader.Load(groupId)
	if err != nil {
		return make([]model.ScheduleProjectLatestPipeline, 0), err
	}
	projects = s.filterProjects(projects)

	var (
		resultchn = make(chan []model.ScheduleProjectLatestPipeline, util.GetMaxChanCapacity(len(projects)))
		g, gctx   = errgroup.WithContext(ctx)
		results   = make([]model.ScheduleProjectLatestPipeline, 0)
	)

	for _, project := range projects {
		run := util.CreateRunFunc[model.Project, []model.ScheduleProjectLatestPipeline](s.getSchedules, resultchn, gctx)
		g.Go(run(project))
	}

	go func() {
		defer close(resultchn)
		g.Wait()
	}()

	for value := range resultchn {
		results = append(results, value...)
	}

	return sortById(results), g.Wait()
}

func (s *scheduleService) getSchedules(project model.Project) ([]model.ScheduleProjectLatestPipeline, error) {
	schedules, err := s.schedulesLoader.Load(project.Id)
	if err != nil {
		return make([]model.ScheduleProjectLatestPipeline, 0), err
	}

	result := make([]model.ScheduleProjectLatestPipeline, 0, len(schedules))
	for _, schedule := range schedules {
		source := "schedule"
		pipeline, _ := s.pipelineLatestLoader.Load(pipeline.NewPipelineKey(project.Id, schedule.Ref, &source))
		result = append(result, model.ScheduleProjectLatestPipeline{
			Schedule: schedule,
			Project:  project,
			Pipeline: pipeline,
		})
	}

	return result, nil
}

func (s *scheduleService) filterProjects(projects []model.Project) []model.Project {
	if len(s.config.ProjectSkipIds) > 0 {
		return slices.Filter(projects, func(project model.Project) bool {
			return !slices.Contains(s.config.ProjectSkipIds, project.Id)
		})
	}
	return projects
}

func sortById(schedules []model.ScheduleProjectLatestPipeline) []model.ScheduleProjectLatestPipeline {
	sort.SliceStable(schedules[:], func(i, j int) bool {
		return schedules[i].Schedule.Id < schedules[j].Schedule.Id
	})
	return schedules
}
