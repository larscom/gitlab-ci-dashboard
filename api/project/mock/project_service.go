package mock

import (
	"context"

	"github.com/larscom/gitlab-ci-dashboard/model"
)

type ProjectServiceMock struct {
	Error error
}

func (s *ProjectServiceMock) GetProjectsWithLatestPipeline(groupId int, ctx context.Context) (map[string][]model.ProjectWithPipeline, error) {
	if groupId == 1 {
		return map[string][]model.ProjectWithPipeline{
			"success": {
				{
					Project:  model.Project{Name: "project-1"},
					Pipeline: &model.Pipeline{Id: 111},
				},
			},
		}, s.Error
	}

	return make(map[string][]model.ProjectWithPipeline), s.Error
}

func (s *ProjectServiceMock) GetProjectsWithPipeline(groupId int, ctx context.Context) ([]model.ProjectWithPipeline, error) {
	if groupId == 1 {
		return []model.ProjectWithPipeline{
			{
				Project:  model.Project{Name: "project-2"},
				Pipeline: &model.Pipeline{Id: 222},
			},
		}, s.Error
	}
	return make([]model.ProjectWithPipeline, 0), s.Error
}
