package project

import (
	"fmt"

	"github.com/larscom/gitlab-ci-dashboard/config"
	"github.com/larscom/gitlab-ci-dashboard/model"
	"github.com/larscom/gitlab-ci-dashboard/pipeline"
	"github.com/rs/zerolog"
	"github.com/xanzy/go-gitlab"
	"golang.org/x/exp/slices"
)

type IProjectService interface {
	GetProjectsGroupedByStatus(groupId int) map[string][]*model.ProjectWithLatestPipeline
}

type ProjectService struct {
	GitlabClient    *gitlab.Client
	Logger          zerolog.Logger
	PipelineService pipeline.IPipelineService
	GitlabConfig    *config.GitlabConfig
}

func NewProjectService(client *gitlab.Client, logger zerolog.Logger, pipelineService pipeline.IPipelineService, config *config.GitlabConfig) *ProjectService {
	return &ProjectService{
		GitlabClient:    client,
		Logger:          logger,
		PipelineService: pipelineService,
		GitlabConfig:    config,
	}
}

func (p *ProjectService) GetProjectsGroupedByStatus(groupId int) map[string][]*model.ProjectWithLatestPipeline {
	projects := p.getProjects(groupId)
	jobs := make(chan *gitlab.Project, len(projects))
	results := make(chan map[string]*model.ProjectWithLatestPipeline, len(projects))

	for _, project := range projects {
		go p.projectProcessor(jobs, results)
		jobs <- project
	}
	close(jobs)

	projectsGroupedByStatus := make(map[string][]*model.ProjectWithLatestPipeline)
	for range projects {
		for status, project := range <-results {
			if p.skipProject(status, project) {
				continue
			}
			current, hasStatus := projectsGroupedByStatus[status]
			if hasStatus {
				projectsGroupedByStatus[status] = append(current, project)
			} else {
				projectsGroupedByStatus[status] = []*model.ProjectWithLatestPipeline{project}
			}
		}
	}

	return projectsGroupedByStatus
}

func (p *ProjectService) skipProject(status string, project *model.ProjectWithLatestPipeline) bool {
	if status == "unknown" && p.GitlabConfig.GitlabProjectHideUnknown {
		return true
	}

	if len(*p.GitlabConfig.GitlabProjectSkipIds) > 0 {
		return slices.Contains(*p.GitlabConfig.GitlabProjectSkipIds, project.Project.ID)
	}

	return false
}

func (p *ProjectService) getProjects(groupId int) []*gitlab.Project {
	projects, resp, err := p.GitlabClient.Groups.ListGroupProjects(groupId, p.createListGroupProjectsOptions(1))
	if err != nil {
		p.Logger.
			Warn().
			Int("status", resp.StatusCode).
			Err(err).
			Msg(fmt.Sprintf("Error while retrieving projects for groupId: %d", groupId))
		return make([]*gitlab.Project, 0)
	}
	if resp.NextPage == 0 || resp.TotalPages == 0 {
		return projects
	}

	capacity := resp.TotalPages - 1
	jobs := make(chan int, capacity)
	results := make(chan []*gitlab.Project, capacity)

	for page := resp.NextPage; page <= resp.TotalPages; page++ {
		go p.pageProcessor(groupId, jobs, results)
		jobs <- page
	}
	close(jobs)

	for i := 0; i < capacity; i++ {
		projects = append(projects, <-results...)
	}

	return projects
}

func (p *ProjectService) projectProcessor(projects <-chan *gitlab.Project, result chan<- map[string]*model.ProjectWithLatestPipeline) {
	for project := range projects {
		pipelines := p.PipelineService.GetPipelines(project.ID, project.DefaultBranch)
		if len(pipelines) > 0 {
			latest := pipelines[0]
			result <- map[string]*model.ProjectWithLatestPipeline{latest.Status: {Project: project, Pipeline: latest}}
		} else {
			result <- map[string]*model.ProjectWithLatestPipeline{"unknown": {Project: project}}
		}
	}
}

func (p *ProjectService) pageProcessor(groupId int, pageNumbers <-chan int, result chan<- []*gitlab.Project) {
	for pageNumber := range pageNumbers {
		projects, resp, err := p.GitlabClient.Groups.ListGroupProjects(groupId, p.createListGroupProjectsOptions(pageNumber))
		if err != nil {
			p.Logger.
				Warn().
				Int("status", resp.StatusCode).
				Err(err).
				Msg(fmt.Sprintf("Error while retrieving projects for groupId: %d", groupId))
			result <- make([]*gitlab.Project, 0)
		} else {
			result <- projects
		}
	}
}

func (p *ProjectService) createListGroupProjectsOptions(pageNumber int) *gitlab.ListGroupProjectsOptions {
	return &gitlab.ListGroupProjectsOptions{
		ListOptions: gitlab.ListOptions{
			Page:    pageNumber,
			PerPage: 100,
		},
		Archived: gitlab.Bool(false),
	}
}
