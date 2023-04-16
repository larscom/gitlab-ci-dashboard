package project

import (
	"github.com/bobg/go-generics/v2/slices"
	"github.com/larscom/gitlab-ci-dashboard/config"
	"github.com/larscom/gitlab-ci-dashboard/model"
	"github.com/larscom/go-cache"
)

type ProjectService interface {
	GetProjectsGroupedByStatus(groupId int) map[string][]model.Project
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

func (s *ProjectServiceImpl) GetProjectsGroupedByStatus(groupId int) map[string][]model.Project {
	projects, _ := s.projectLoader.Get(model.GroupId(groupId))

	if len(s.config.ProjectSkipIds) > 0 {
		projects = slices.Filter(projects, func(p *model.Project) bool {
			return !slices.Contains(s.config.ProjectSkipIds, p.Id)
		})
	}

	chn := make(chan model.Project, len(projects))
	for _, project := range projects {
		go s.getLatestPipeline(*project, chn)
	}

	projectsGroupedByStatus := make(map[string][]model.Project)

	for i := 0; i < len(projects); i++ {
		project := <-chn
		status := "unknown"
		if project.LatestPipeline != nil {
			status = project.LatestPipeline.Status
		}
		if status == "unknown" && s.config.ProjectHideUnknown {
			continue
		}
		currentProjects, hasStatus := projectsGroupedByStatus[status]
		if hasStatus {
			projectsGroupedByStatus[status] = append(currentProjects, project)
		} else {
			projectsGroupedByStatus[status] = []model.Project{project}
		}
	}

	close(chn)

	return projectsGroupedByStatus
}

func (s *ProjectServiceImpl) getLatestPipeline(project model.Project, chn chan<- model.Project) {
	key := model.NewPipelineKey(project.Id, project.DefaultBranch, nil)
	pipeline, _ := s.pipelineLatestLoader.Get(key)
	project.LatestPipeline = pipeline
	chn <- project
}
