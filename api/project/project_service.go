package project

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

type ProjectService interface {
	GetProjectsWithLatestPipeline(groupId int, ctx context.Context) ([]model.ProjectLatestPipeline, error)

	GetProjectsWithPipeline(groupId int, ctx context.Context) ([]model.ProjectPipelines, error)
}

type projectService struct {
	config               *config.GitlabConfig
	projectsLoader       ldgc.LoadingCache[int, []model.Project]
	pipelineLatestLoader ldgc.LoadingCache[pipeline.Key, *model.Pipeline]
	pipelinesLoader      ldgc.LoadingCache[int, []model.Pipeline]
}

func NewService(
	config *config.GitlabConfig,
	projectsLoader ldgc.LoadingCache[int, []model.Project],
	pipelineLatestLoader ldgc.LoadingCache[pipeline.Key, *model.Pipeline],
	pipelinesLoader ldgc.LoadingCache[int, []model.Pipeline],
) ProjectService {
	return &projectService{
		config:               config,
		projectsLoader:       projectsLoader,
		pipelineLatestLoader: pipelineLatestLoader,
		pipelinesLoader:      pipelinesLoader,
	}
}

func (s *projectService) GetProjectsWithLatestPipeline(groupId int, ctx context.Context) ([]model.ProjectLatestPipeline, error) {
	projects, err := s.projectsLoader.Load(groupId)
	if err != nil {
		return make([]model.ProjectLatestPipeline, 0), err
	}
	projects = s.filterProjects(projects)

	var (
		resultchn = make(chan model.ProjectLatestPipeline, util.GetMaxChanCapacity(len(projects)))
		g, gctx   = errgroup.WithContext(ctx)
		results   = make([]model.ProjectLatestPipeline, 0)
	)

	for _, project := range projects {
		run := util.CreateRunFunc[model.Project, model.ProjectLatestPipeline](
			s.getLatestPipeline,
			resultchn,
			gctx,
		)
		g.Go(run(project))
	}

	go func() {
		defer close(resultchn)
		g.Wait()
	}()

	for value := range resultchn {
		results = append(results, value)
	}

	return sortByUpdatedDate(results), g.Wait()
}

func (s *projectService) GetProjectsWithPipeline(groupId int, ctx context.Context) ([]model.ProjectPipelines, error) {
	projects, err := s.projectsLoader.Load(groupId)
	if err != nil {
		return make([]model.ProjectPipelines, 0), err
	}
	projects = s.filterProjects(projects)

	var (
		resultchn = make(chan model.ProjectPipelines, util.GetMaxChanCapacity(len(projects)))
		g, gctx   = errgroup.WithContext(ctx)
		results   = make([]model.ProjectPipelines, 0)
	)

	for _, project := range projects {
		run := util.CreateRunFunc[model.Project, model.ProjectPipelines](s.getPipelines, resultchn, gctx)
		g.Go(run(project))
	}

	go func() {
		defer close(resultchn)
		g.Wait()
	}()

	for value := range resultchn {
		results = append(results, value)
	}

	return results, g.Wait()
}

func (s *projectService) getPipelines(project model.Project) (model.ProjectPipelines, error) {
	pipelines, err := s.pipelinesLoader.Load(project.Id)
	return model.ProjectPipelines{
		Project:   project,
		Pipelines: pipelines,
	}, err
}

func sortByUpdatedDate(projects []model.ProjectLatestPipeline) []model.ProjectLatestPipeline {
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

func (s *projectService) getLatestPipeline(project model.Project) (model.ProjectLatestPipeline, error) {
	key := pipeline.NewPipelineKey(project.Id, project.DefaultBranch, nil)
	pipeline, err := s.pipelineLatestLoader.Load(key)
	return model.ProjectLatestPipeline{
		Project:  project,
		Pipeline: pipeline,
	}, err
}

func (s *projectService) filterProjects(projects []model.Project) []model.Project {
	if len(s.config.ProjectSkipIds) > 0 {
		return slices.Filter(projects, func(project model.Project) bool {
			return !slices.Contains(s.config.ProjectSkipIds, project.Id)
		})
	}
	return projects
}
