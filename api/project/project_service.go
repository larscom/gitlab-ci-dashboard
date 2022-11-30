package project

import (
	"github.com/larscom/gitlab-ci-dashboard/model"
	"github.com/larscom/gitlab-ci-dashboard/pipeline"
	"github.com/xanzy/go-gitlab"
)

type ProjectService struct {
	client          *gitlab.Client
	pipelineService *pipeline.PipelineService
}

type ProjectPageProcessorResult struct {
	projects []*gitlab.Project
	err      *model.Error
}

type ProjectProcessorResult struct {
	projects *model.ProjectPipelines
	err      *model.Error
}

func NewProjectService(client *gitlab.Client, pipelineService *pipeline.PipelineService) *ProjectService {
	return &ProjectService{
		client:          client,
		pipelineService: pipelineService,
	}
}

func (p *ProjectService) GetProjectsWithPipelines(groupId int) ([]*model.ProjectPipelines, *model.Error) {
	projects, err := p.getProjects(groupId)
	if err != nil {
		return nil, err
	}

	jobs := make(chan *gitlab.Project, len(projects))
	results := make(chan *ProjectProcessorResult, len(projects))

	for _, project := range projects {
		go p.projectProcessor(jobs, results)
		jobs <- project
	}
	close(jobs)

	projectsWithPipelines := []*model.ProjectPipelines{}

	for range projects {
		result := <-results
		if result.err != nil {
			return nil, err
		}
		projectsWithPipelines = append(projectsWithPipelines, result.projects)
	}

	return projectsWithPipelines, nil
}

func (p *ProjectService) getProjects(groupId int) ([]*gitlab.Project, *model.Error) {
	projects, resp, err := p.client.Groups.ListGroupProjects(groupId, p.createListGroupProjectsOptions(1))
	if err != nil {
		return nil, model.NewError(resp.StatusCode, resp.Status)
	}
	if resp.NextPage == 0 || resp.TotalPages == 0 {
		return projects, nil
	}

	capacity := resp.TotalPages - 1
	jobs := make(chan int, capacity)
	results := make(chan *ProjectPageProcessorResult, capacity)

	for page := resp.NextPage; page <= resp.TotalPages; page++ {
		go p.pageProcessor(jobs, results, groupId)
		jobs <- page
	}
	close(jobs)

	for i := 0; i < capacity; i++ {
		result := <-results
		if result.err != nil {
			return nil, result.err
		}
		projects = append(projects, result.projects...)
	}

	return projects, nil
}

func (p *ProjectService) projectProcessor(projects <-chan *gitlab.Project, result chan<- *ProjectProcessorResult) {
	for project := range projects {
		pipelines, err := p.pipelineService.GetPipelines(project.ID, project.DefaultBranch)
		if err != nil {
			result <- &ProjectProcessorResult{err: err}
		} else {
			result <- &ProjectProcessorResult{projects: &model.ProjectPipelines{Project: project, Pipelines: pipelines}}
		}
	}
}

func (p *ProjectService) pageProcessor(pageNumbers <-chan int, result chan<- *ProjectPageProcessorResult, groupId int) {
	for pageNumber := range pageNumbers {
		projects, resp, err := p.client.Groups.ListGroupProjects(groupId, p.createListGroupProjectsOptions(pageNumber))
		if err != nil {
			result <- &ProjectPageProcessorResult{err: model.NewError(resp.StatusCode, resp.Status)}
		} else {
			result <- &ProjectPageProcessorResult{projects: projects}
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
