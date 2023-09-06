package mock

import "github.com/larscom/gitlab-ci-dashboard/model"

type ProjectServiceMock struct{}

func (s *ProjectServiceMock) GetProjectsWithLatestPipeline(groupId int) (map[string][]model.ProjectWithPipeline, error) {
	if groupId == 1 {
		return map[string][]model.ProjectWithPipeline{
			"success": {
				{
					Project:  model.Project{Name: "project-1"},
					Pipeline: &model.Pipeline{Id: 111},
				},
			},
		}, nil
	}

	return make(map[string][]model.ProjectWithPipeline), nil
}

func (s *ProjectServiceMock) GetProjectsWithPipeline(groupId int) ([]model.ProjectWithPipeline, error) {
	if groupId == 1 {
		return []model.ProjectWithPipeline{
			{
				Project:  model.Project{Name: "project-2"},
				Pipeline: &model.Pipeline{Id: 222},
			},
		}, nil
	}
	return make([]model.ProjectWithPipeline, 0), nil
}
