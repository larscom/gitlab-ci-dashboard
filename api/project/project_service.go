package project

import (
	"sort"
	"sync"

	"github.com/bobg/go-generics/v2/slices"
	"github.com/larscom/gitlab-ci-dashboard/config"
	"github.com/larscom/gitlab-ci-dashboard/model"
	"github.com/larscom/go-cache"
)

type PipelineStatus = string

type ProjectService interface {
	GetProjectsWithLatestPipeline(groupId int) map[PipelineStatus][]model.ProjectWithPipeline
	GetProjectsWithPipeline(groupId int) []model.ProjectWithPipeline
}

type ProjectServiceImpl struct {
	config               *config.GitlabConfig
	projectsLoader       cache.Cache[model.GroupId, []model.Project]
	pipelineLatestLoader cache.Cache[model.PipelineKey, *model.Pipeline]
	pipelinesLoader      cache.Cache[model.ProjectId, []model.Pipeline]
}

func NewProjectService(
	config *config.GitlabConfig,
	projectsLoader cache.Cache[model.GroupId, []model.Project],
	pipelineLatestLoader cache.Cache[model.PipelineKey, *model.Pipeline],
	pipelinesLoader cache.Cache[model.ProjectId, []model.Pipeline],
) ProjectService {
	return &ProjectServiceImpl{
		config,
		projectsLoader,
		pipelineLatestLoader,
		pipelinesLoader,
	}
}

func (s *ProjectServiceImpl) GetProjectsWithLatestPipeline(groupId int) map[PipelineStatus][]model.ProjectWithPipeline {
	projects, _ := s.projectsLoader.Get(model.GroupId(groupId))

	if len(s.config.ProjectSkipIds) > 0 {
		projects = slices.Filter(projects, func(p model.Project) bool {
			return !slices.Contains(s.config.ProjectSkipIds, p.Id)
		})
	}

	chn := make(chan map[PipelineStatus]model.ProjectWithPipeline, 20)

	var wg sync.WaitGroup
	for _, project := range projects {
		wg.Add(1)
		go s.getLatestPipeline(project, &wg, chn)
	}

	go func() {
		defer close(chn)
		wg.Wait()
	}()

	result := make(map[PipelineStatus][]model.ProjectWithPipeline)

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

	return result
}

func (s *ProjectServiceImpl) GetProjectsWithPipeline(groupId int) []model.ProjectWithPipeline {
	projects, _ := s.projectsLoader.Get(model.GroupId(groupId))

	if len(s.config.ProjectSkipIds) > 0 {
		projects = slices.Filter(projects, func(p model.Project) bool {
			return !slices.Contains(s.config.ProjectSkipIds, p.Id)
		})
	}

	chn := make(chan []model.ProjectWithPipeline, 20)

	var wg sync.WaitGroup
	for _, project := range projects {
		wg.Add(1)
		go s.getPipelines(project, &wg, chn)
	}

	go func() {
		defer close(chn)
		wg.Wait()
	}()

	result := make([]model.ProjectWithPipeline, 0)
	for value := range chn {
		result = append(result, value...)
	}

	return sortByUpdatedDate(result)
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

func (s *ProjectServiceImpl) getLatestPipeline(project model.Project, wg *sync.WaitGroup, chn chan<- map[PipelineStatus]model.ProjectWithPipeline) {
	defer wg.Done()

	key := model.NewPipelineKey(project.Id, project.DefaultBranch, nil)
	pipeline, _ := s.pipelineLatestLoader.Get(key)

	if pipeline != nil {
		chn <- map[PipelineStatus]model.ProjectWithPipeline{
			pipeline.Status: {
				Project:  project,
				Pipeline: pipeline,
			},
		}
	}
}

func (s *ProjectServiceImpl) getPipelines(project model.Project, wg *sync.WaitGroup, chn chan<- []model.ProjectWithPipeline) {
	defer wg.Done()

	pipelines, _ := s.pipelinesLoader.Get(model.ProjectId(project.Id))
	result := make([]model.ProjectWithPipeline, len(pipelines))

	for i := 0; i < len(pipelines); i++ {
		pipeline := pipelines[i]
		result[i] = model.ProjectWithPipeline{
			Project:  project,
			Pipeline: &pipeline,
		}
	}

	chn <- result
}
