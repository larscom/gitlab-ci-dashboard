package mock

import (
	"context"

	"github.com/larscom/gitlab-ci-dashboard/model"
)

type ProjectServiceMock struct {
	Error error
}

func (s *ProjectServiceMock) GetProjectsWithLatestPipeline(groupId int, ctx context.Context) ([]model.ProjectLatestPipeline, error) {
	projects := make([]model.ProjectLatestPipeline, 0)

	if groupId == 1 {
		projects = append(projects, model.ProjectLatestPipeline{
			Project:  model.Project{Name: "project-1"},
			Pipeline: &model.Pipeline{Id: 111, Status: "success"},
		})
	}

	return projects, s.Error
}

func (s *ProjectServiceMock) GetProjectsWithPipeline(groupId int, ctx context.Context) ([]model.ProjectPipelines, error) {
	projects := make([]model.ProjectPipelines, 0)
	if groupId == 1 {
		projects = append(projects, model.ProjectPipelines{
			Project: model.Project{Name: "project-2"},
			Pipelines: []model.Pipeline{
				{Id: 222},
			},
		})
	}
	return projects, s.Error
}
