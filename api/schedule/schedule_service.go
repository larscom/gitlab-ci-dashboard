package schedule

import (
	"sort"

	"github.com/bobg/go-generics/v2/slices"
	"github.com/larscom/gitlab-ci-dashboard/config"
	"github.com/larscom/gitlab-ci-dashboard/model"
	"github.com/larscom/gitlab-ci-dashboard/pipeline"
	"github.com/larscom/gitlab-ci-dashboard/util"
	"github.com/larscom/go-cache"
	"golang.org/x/net/context"
	"golang.org/x/sync/errgroup"
)

type ScheduleService interface {
	GetSchedules(groupId int, ctx context.Context) ([]model.ScheduleWithProjectAndPipeline, error)
}

type scheduleService struct {
	config               *config.GitlabConfig
	projectsLoader       cache.Cache[int, []model.Project]
	schedulesLoader      cache.Cache[int, []model.Schedule]
	pipelineLatestLoader cache.Cache[pipeline.Key, *model.Pipeline]
}

func NewService(
	config *config.GitlabConfig,
	projectsLoader cache.Cache[int, []model.Project],
	schedulesLoader cache.Cache[int, []model.Schedule],
	pipelineLatestLoader cache.Cache[pipeline.Key, *model.Pipeline],
) ScheduleService {
	return &scheduleService{
		config:               config,
		projectsLoader:       projectsLoader,
		schedulesLoader:      schedulesLoader,
		pipelineLatestLoader: pipelineLatestLoader,
	}
}

func (s *scheduleService) GetSchedules(groupId int, ctx context.Context) ([]model.ScheduleWithProjectAndPipeline, error) {
	projects, err := s.projectsLoader.Get(groupId)
	if err != nil {
		return make([]model.ScheduleWithProjectAndPipeline, 0), err
	}
	projects = s.filterProjects(projects)

	var (
		resultchn = make(chan []model.ScheduleWithProjectAndPipeline, util.GetMaxChanCapacity(len(projects)))
		g, gctx   = errgroup.WithContext(ctx)
		results   = make([]model.ScheduleWithProjectAndPipeline, 0)
	)

	for _, project := range projects {
		run := util.CreateRunFunc[model.Project, []model.ScheduleWithProjectAndPipeline](s.getSchedules, resultchn, gctx)
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

func (s *scheduleService) getSchedules(project model.Project) ([]model.ScheduleWithProjectAndPipeline, error) {
	schedules, err := s.schedulesLoader.Get(project.Id)
	if err != nil {
		return make([]model.ScheduleWithProjectAndPipeline, 0), err
	}

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

func sortById(schedules []model.ScheduleWithProjectAndPipeline) []model.ScheduleWithProjectAndPipeline {
	sort.SliceStable(schedules[:], func(i, j int) bool {
		return schedules[i].Schedule.Id < schedules[j].Schedule.Id
	})
	return schedules
}
