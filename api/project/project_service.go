package project

import (
	"github.com/bobg/go-generics/v2/slices"
	"github.com/larscom/gitlab-ci-dashboard/config"
	"github.com/larscom/gitlab-ci-dashboard/model"
	"github.com/larscom/go-cache"
)

type ProjectService interface {
	GetProjectsGroupedByStatus(groupId int) map[string][]*model.ProjectPipeline
}

type ProjectServiceImpl struct {
	config               *config.GitlabConfig
	projectLoader        cache.Cache[model.GroupId, []*model.Project]
	pipelineLatestLoader cache.Cache[model.PipelineKey, *model.Pipeline]
}

func NewProjectService(
	config *config.GitlabConfig,
	projectLoader cache.Cache[model.GroupId, []*model.Project],
	pipelineLatestLoader cache.Cache[model.PipelineKey, *model.Pipeline],
) ProjectService {
	return &ProjectServiceImpl{config, projectLoader, pipelineLatestLoader}
}

func (s *ProjectServiceImpl) GetProjectsGroupedByStatus(groupId int) map[string][]*model.ProjectPipeline {
	projects, _ := s.projectLoader.Get(model.GroupId(groupId))

	if len(s.config.ProjectSkipIds) > 0 {
		projects = slices.Filter(projects, func(p *model.Project) bool {
			return !slices.Contains(s.config.ProjectSkipIds, p.Id)
		})
	}

	result := make(chan map[string]*model.ProjectPipeline, len(projects))

	for _, project := range projects {
		go s.getLatestPipelineWithStatus(project, result)
	}

	projectsGroupedByStatus := make(map[string][]*model.ProjectPipeline)

	for range projects {
		for status, projectPipeline := range <-result {
			if status == "unknown" && s.config.ProjectHideUnknown {
				continue
			}
			current, hasStatus := projectsGroupedByStatus[status]
			if hasStatus {
				projectsGroupedByStatus[status] = append(current, projectPipeline)
			} else {
				projectsGroupedByStatus[status] = []*model.ProjectPipeline{projectPipeline}
			}
		}
	}

	close(result)

	return projectsGroupedByStatus
}

func (s *ProjectServiceImpl) getLatestPipelineWithStatus(project *model.Project, result chan<- map[string]*model.ProjectPipeline) {
	key := model.NewPipelineKey(project.Id, project.DefaultBranch)
	pipeline, _ := s.pipelineLatestLoader.Get(key)
	if pipeline != nil {
		result <- map[string]*model.ProjectPipeline{pipeline.Status: {Project: project, Pipeline: pipeline}}
	} else {
		result <- map[string]*model.ProjectPipeline{"unknown": {Project: project}}
	}
}
