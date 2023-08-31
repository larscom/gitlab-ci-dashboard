package project

import (
	"github.com/bobg/go-generics/v2/slices"
	"github.com/larscom/gitlab-ci-dashboard/config"
	"github.com/larscom/gitlab-ci-dashboard/model"
	"github.com/larscom/gitlab-ci-dashboard/pipeline"
	"github.com/larscom/gitlab-ci-dashboard/util"
	"github.com/larscom/go-cache"
	"golang.org/x/net/context"
	"golang.org/x/sync/errgroup"
	"sort"
)

type PipelineStatus = string

type Service interface {
	GetProjectsWithLatestPipeline(groupId int) (map[PipelineStatus][]model.ProjectWithPipeline, error)

	GetProjectsWithPipeline(groupId int) ([]model.ProjectWithPipeline, error)
}

type ServiceImpl struct {
	config               *config.GitlabConfig
	projectsLoader       cache.Cache[int, []model.Project]
	pipelineLatestLoader cache.Cache[pipeline.Key, *model.Pipeline]
	pipelinesLoader      cache.Cache[int, []model.Pipeline]
}

func NewService(
	config *config.GitlabConfig,
	projectsLoader cache.Cache[int, []model.Project],
	pipelineLatestLoader cache.Cache[pipeline.Key, *model.Pipeline],
	pipelinesLoader cache.Cache[int, []model.Pipeline],
) Service {
	return &ServiceImpl{
		config,
		projectsLoader,
		pipelineLatestLoader,
		pipelinesLoader,
	}
}

func (s *ServiceImpl) GetProjectsWithLatestPipeline(groupId int) (map[PipelineStatus][]model.ProjectWithPipeline, error) {
	projects, err := s.projectsLoader.Get(groupId)
	if err != nil {
		return make(map[PipelineStatus][]model.ProjectWithPipeline), err
	}
	projects = s.filterProjects(projects)

	var (
		resultchn = make(chan map[PipelineStatus]model.ProjectWithPipeline, util.GetMaxChanCapacity(len(projects)))
		g, ctx    = errgroup.WithContext(context.Background())
		results   = make(map[PipelineStatus][]model.ProjectWithPipeline)
	)

	for _, project := range projects {
		run := util.CreateRunFunc[model.Project, map[PipelineStatus]model.ProjectWithPipeline](
			s.getLatestPipeline,
			resultchn,
			ctx,
		)
		g.Go(run(project))
	}

	go func() {
		defer close(resultchn)
		g.Wait()
	}()

	for value := range resultchn {
		for status, v := range value {
			current, hasStatus := results[status]
			if hasStatus {
				results[status] = append(current, v)
			} else {
				results[status] = []model.ProjectWithPipeline{v}
			}
		}
	}

	for status, value := range results {
		results[status] = sortByUpdatedDate(value)
	}

	return results, g.Wait()
}

func (s *ServiceImpl) GetProjectsWithPipeline(groupId int) ([]model.ProjectWithPipeline, error) {
	projects, err := s.projectsLoader.Get(groupId)
	if err != nil {
		return make([]model.ProjectWithPipeline, 0), err
	}
	projects = s.filterProjects(projects)

	var (
		resultchn = make(chan []model.ProjectWithPipeline, util.GetMaxChanCapacity(len(projects)))
		g, ctx    = errgroup.WithContext(context.Background())
		results   = make([]model.ProjectWithPipeline, 0)
	)

	for _, project := range projects {
		run := util.CreateRunFunc[model.Project, []model.ProjectWithPipeline](s.getPipelines, resultchn, ctx)
		g.Go(run(project))
	}

	go func() {
		defer close(resultchn)
		g.Wait()
	}()

	for value := range resultchn {
		results = append(results, value...)
	}

	return sortByUpdatedDate(results), g.Wait()
}

func (s *ServiceImpl) getPipelines(project model.Project) ([]model.ProjectWithPipeline, error) {
	pipelines, err := s.pipelinesLoader.Get(project.Id)
	if err != nil {
		return make([]model.ProjectWithPipeline, 0), err
	}

	result := make([]model.ProjectWithPipeline, len(pipelines))
	for i := 0; i < len(pipelines); i++ {
		result[i] = model.ProjectWithPipeline{
			Project:  project,
			Pipeline: &pipelines[i],
		}
	}

	return result, nil
}

func sortByUpdatedDate(projects []model.ProjectWithPipeline) []model.ProjectWithPipeline {
	sort.SliceStable(projects[:], func(i, j int) bool {
		pipelineA := projects[i].Pipeline
		pipelineB := projects[j].Pipeline

		if pipelineA == nil {
			return false
		}
		if pipelineB == nil {
			return true
		}

		return pipelineA.UpdatedAt.After(pipelineB.UpdatedAt)
	})
	return projects
}

func (s *ServiceImpl) getLatestPipeline(project model.Project) (map[PipelineStatus]model.ProjectWithPipeline, error) {
	key := pipeline.NewPipelineKey(project.Id, project.DefaultBranch, nil)
	pipeline, err := s.pipelineLatestLoader.Get(key)

	if err != nil {
		return make(map[PipelineStatus]model.ProjectWithPipeline), err
	}

	if pipeline != nil {
		return map[PipelineStatus]model.ProjectWithPipeline{
			pipeline.Status: {
				Project:  project,
				Pipeline: pipeline,
			},
		}, nil
	}

	return make(map[PipelineStatus]model.ProjectWithPipeline), nil
}

func (s *ServiceImpl) filterProjects(projects []model.Project) []model.Project {
	if len(s.config.ProjectSkipIds) > 0 {
		return slices.Filter(projects, func(project model.Project) bool {
			return !slices.Contains(s.config.ProjectSkipIds, project.Id)
		})
	}
	return projects
}
