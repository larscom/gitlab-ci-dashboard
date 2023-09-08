package mock

import "github.com/larscom/gitlab-ci-dashboard/model"

type ProjectServiceMock struct {
	Error error
}

func (s *ProjectServiceMock) GetProjectsWithLatestPipeline(id model.GroupId) (map[string][]model.ProjectWithPipeline, error) {
	if id == 1 {
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

func (s *ProjectServiceMock) GetProjectsWithPipeline(id model.GroupId) ([]model.ProjectWithPipeline, error) {
	if id == 1 {
		return []model.ProjectWithPipeline{
			{
				Project:  model.Project{Name: "project-2"},
				Pipeline: &model.Pipeline{Id: 222},
			},
		}, s.Error
	}
	return make([]model.ProjectWithPipeline, 0), s.Error
}
