package project

import (
	"github.com/bobg/go-generics/v2/slices"
	"github.com/larscom/gitlab-ci-dashboard/config"
	"github.com/larscom/gitlab-ci-dashboard/model"
	"github.com/larscom/go-cache"
)

type PipelineStatus = string

type ProjectService interface {
	GetProjectsWithLatestPipeline(groupId int) map[PipelineStatus][]model.ProjectWithLatestPipeline
}

type ProjectServiceImpl struct {
	config               *config.GitlabConfig
	projectLoader        cache.Cache[model.GroupId, []model.Project]
	pipelineLatestLoader cache.Cache[model.PipelineKey, *model.Pipeline]
}

func NewProjectService(
	config *config.GitlabConfig,
	projectLoader cache.Cache[model.GroupId, []model.Project],
	pipelineLatestLoader cache.Cache[model.PipelineKey, *model.Pipeline],
) ProjectService {
	return &ProjectServiceImpl{
		config,
		projectLoader,
		pipelineLatestLoader,
	}
}

func (s *ProjectServiceImpl) GetProjectsWithLatestPipeline(groupId int) map[PipelineStatus][]model.ProjectWithLatestPipeline {
	projects, _ := s.projectLoader.Get(model.GroupId(groupId))

	if len(s.config.ProjectSkipIds) > 0 {
		projects = slices.Filter(projects, func(p model.Project) bool {
			return !slices.Contains(s.config.ProjectSkipIds, p.Id)
		})
	}

	chn := make(chan model.ProjectWithLatestPipeline, len(projects))
	for _, project := range projects {
		go s.getLatestPipeline(project, chn)
	}

	projectsWithLatestPipeline := make(map[string][]model.ProjectWithLatestPipeline)

	for i := 0; i < len(projects); i++ {
		p := <-chn
		status := "unknown"
		if p.LatestPipeline != nil {
			status = p.LatestPipeline.Status
		}
		if status == "unknown" && s.config.ProjectHideUnknown {
			continue
		}
		c, hasStatus := projectsWithLatestPipeline[status]
		if hasStatus {
			projectsWithLatestPipeline[status] = append(c, p)
		} else {
			projectsWithLatestPipeline[status] = []model.ProjectWithLatestPipeline{p}
		}
	}

	close(chn)

	return projectsWithLatestPipeline
}

func (s *ProjectServiceImpl) getLatestPipeline(project model.Project, chn chan<- model.ProjectWithLatestPipeline) {
	key := model.NewPipelineKey(project.Id, project.DefaultBranch, nil)
	pipeline, _ := s.pipelineLatestLoader.Get(key)
	chn <- model.ProjectWithLatestPipeline{
		Project:        project,
		LatestPipeline: pipeline,
	}
}
