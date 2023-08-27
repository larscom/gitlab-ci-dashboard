package project

import (
	"github.com/larscom/gitlab-ci-dashboard/model"
	"github.com/larscom/gitlab-ci-dashboard/pipeline"
	"sort"
	"sync"

	"github.com/bobg/go-generics/v2/slices"
	"github.com/larscom/gitlab-ci-dashboard/config"

	"github.com/larscom/go-cache"
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
	result := make(map[PipelineStatus][]model.ProjectWithPipeline)

	projects, err := s.projectsLoader.Get(groupId)
	if err != nil {
		return result, err
	}

	if len(s.config.ProjectSkipIds) > 0 {
		projects = slices.Filter(projects, func(p model.Project) bool {
			return !slices.Contains(s.config.ProjectSkipIds, p.Id)
		})
	}

	var (
		chn    = make(chan map[PipelineStatus]model.ProjectWithPipeline, len(projects))
		errchn = make(chan error)
		wg     sync.WaitGroup
	)

	for _, project := range projects {
		wg.Add(1)
		go s.getLatestPipeline(project, &wg, chn, errchn)
	}

	go func() {
		defer close(errchn)
		defer close(chn)
		wg.Wait()
	}()

	if e := <-errchn; e != nil {
		return result, e
	}

	for m := range chn {
		for status, value := range m {
			current, hasStatus := result[status]
			if hasStatus {
				result[status] = append(current, value)
			} else {
				result[status] = []model.ProjectWithPipeline{value}
			}
		}
	}

	return result, nil
}

func (s *ServiceImpl) GetProjectsWithPipeline(groupId int) ([]model.ProjectWithPipeline, error) {
	result := make([]model.ProjectWithPipeline, 0)

	projects, err := s.projectsLoader.Get(groupId)
	if err != nil {
		return result, err
	}

	if len(s.config.ProjectSkipIds) > 0 {
		projects = slices.Filter(projects, func(p model.Project) bool {
			return !slices.Contains(s.config.ProjectSkipIds, p.Id)
		})
	}

	var (
		chn    = make(chan []model.ProjectWithPipeline, len(projects))
		errchn = make(chan error)
		wg     sync.WaitGroup
	)

	for _, project := range projects {
		wg.Add(1)
		go s.getPipelines(project, &wg, chn, errchn)
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

	return sortByUpdatedDate(result), nil
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

func (s *ServiceImpl) getLatestPipeline(
	project model.Project,
	wg *sync.WaitGroup,
	chn chan<- map[PipelineStatus]model.ProjectWithPipeline,
	errchn chan<- error,
) {
	defer wg.Done()

	key := pipeline.NewPipelineKey(project.Id, project.DefaultBranch, nil)
	pipeline, err := s.pipelineLatestLoader.Get(key)

	if err != nil {
		errchn <- err
	} else if pipeline != nil {
		chn <- map[PipelineStatus]model.ProjectWithPipeline{
			pipeline.Status: {
				Project:  project,
				Pipeline: pipeline,
			},
		}
	}
}

func (s *ServiceImpl) getPipelines(
	project model.Project,
	wg *sync.WaitGroup,
	chn chan<- []model.ProjectWithPipeline,
	errchn chan<- error,
) {
	defer wg.Done()

	pipelines, err := s.pipelinesLoader.Get(project.Id)
	if err != nil {
		errchn <- err
	} else {
		result := make([]model.ProjectWithPipeline, len(pipelines))
		for i := 0; i < len(pipelines); i++ {
			result[i] = model.ProjectWithPipeline{
				Project:  project,
				Pipeline: &pipelines[i],
			}
		}
		chn <- result
	}
}
