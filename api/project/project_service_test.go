package project

import (
	"fmt"
	"strings"
	"testing"

	"github.com/larscom/gitlab-ci-dashboard/config"
	"github.com/larscom/gitlab-ci-dashboard/model"
	"github.com/larscom/go-cache"
	"github.com/stretchr/testify/assert"
)

func TestProjectServiceWithConfig(t *testing.T) {

	createConfig := func(t *testing.T, skipProjectIds []int, hideUnknown bool) *config.GitlabConfig {
		t.Setenv("GITLAB_BASE_URL", "http://gitlab.fake")
		t.Setenv("GITLAB_API_TOKEN", "abc123")
		t.Setenv("GITLAB_PROJECT_HIDE_UNKNOWN", fmt.Sprintf("%v", hideUnknown))

		if len(skipProjectIds) > 0 {
			projectIdsStrings := make([]string, len(skipProjectIds))
			for i, num := range skipProjectIds {
				projectIdsStrings[i] = fmt.Sprintf("%d", num)
			}
			t.Setenv("GITLAB_PROJECT_SKIP_IDS", strings.Join(projectIdsStrings, ","))
		}

		return config.NewGitlabConfig()
	}

	t.Run("GetProjectsWithLatestPipeline", func(t *testing.T) {
		pipelineLatestLoader := cache.New[model.PipelineKey, *model.Pipeline]()
		projectLoader := cache.New[model.GroupId, []model.Project]()
		cfg := createConfig(t, make([]int, 0), false)

		service := NewProjectService(cfg, projectLoader, pipelineLatestLoader)

		projectLoader.Put(model.GroupId(1),
			[]model.Project{
				{Id: 111, Name: "project-1", DefaultBranch: "master"},
				{Id: 222, Name: "project-2", DefaultBranch: "main"},
				{Id: 333, Name: "project-3", DefaultBranch: "main"},
			},
		)

		pipelineLatestLoader.Put(model.NewPipelineKey(111, "master", nil), &model.Pipeline{Id: 1010, Status: "success"})
		pipelineLatestLoader.Put(model.NewPipelineKey(222, "main", nil), &model.Pipeline{Id: 2020, Status: "failed"})
		pipelineLatestLoader.Put(model.NewPipelineKey(333, "main", nil), &model.Pipeline{Id: 3030, Status: "success"})

		result := service.GetProjectsWithLatestPipeline(1)
		assert.Len(t, result, 2)

		success := result["success"]
		assert.Len(t, success, 2)

		for _, entry := range success {
			if entry.Project.Id == 111 {
				assert.Equal(t, "project-1", entry.Project.Name)
				assert.Equal(t, 1010, entry.LatestPipeline.Id)
				assert.Equal(t, "success", entry.LatestPipeline.Status)
			} else if entry.Project.Id == 333 {
				assert.Equal(t, "project-3", entry.Project.Name)
				assert.Equal(t, 3030, entry.LatestPipeline.Id)
				assert.Equal(t, "success", entry.LatestPipeline.Status)
			} else {
				t.Errorf("expected projectId 111 and projectId 333")
			}
		}

		failed := result["failed"]
		assert.Len(t, failed, 1)
		assert.Equal(t, "project-2", failed[0].Project.Name)
		assert.Equal(t, 222, failed[0].Project.Id)
		assert.Equal(t, 2020, failed[0].LatestPipeline.Id)
		assert.Equal(t, "failed", failed[0].LatestPipeline.Status)
	})

	t.Run("GetProjectsWithLatestPipelineUnknown", func(t *testing.T) {
		pipelineLatestLoader := cache.New[model.PipelineKey, *model.Pipeline]()
		projectLoader := cache.New[model.GroupId, []model.Project]()
		cfg := createConfig(t, make([]int, 0), false)

		service := NewProjectService(cfg, projectLoader, pipelineLatestLoader)

		projectLoader.Put(model.GroupId(1), []model.Project{{Id: 111, Name: "project-1", DefaultBranch: "master"}})

		pipelineLatestLoader.Put(model.NewPipelineKey(111, "master", nil), nil)

		projectsGroupedByStatus := service.GetProjectsWithLatestPipeline(1)
		assert.Len(t, projectsGroupedByStatus, 1)

		result := projectsGroupedByStatus["unknown"]

		assert.Len(t, result, 1)
		assert.Equal(t, "project-1", result[0].Project.Name)
		assert.Equal(t, 111, result[0].Project.Id)
		assert.Nil(t, result[0].LatestPipeline)
	})

	t.Run("GetProjectsWithLatestPipelineHideUnknown", func(t *testing.T) {
		pipelineLatestLoader := cache.New[model.PipelineKey, *model.Pipeline]()
		projectLoader := cache.New[model.GroupId, []model.Project]()

		const hideUnknown = true
		cfg := createConfig(t, make([]int, 0), hideUnknown)

		service := NewProjectService(cfg, projectLoader, pipelineLatestLoader)

		projectLoader.Put(model.GroupId(1),
			[]model.Project{
				{Id: 111, Name: "project-1", DefaultBranch: "master"},
				{Id: 222, Name: "project-2", DefaultBranch: "main"},
			},
		)

		pipelineLatestLoader.Put(model.NewPipelineKey(111, "master", nil), &model.Pipeline{Id: 1010, Status: "success"})
		pipelineLatestLoader.Put(model.NewPipelineKey(222, "main", nil), nil)

		result := service.GetProjectsWithLatestPipeline(1)
		assert.Len(t, result, 1)

		success := result["success"]

		assert.Len(t, success, 1)
		assert.Equal(t, "project-1", success[0].Project.Name)
	})

	t.Run("GetProjectsWithLatestPipelineSkipProjectIds", func(t *testing.T) {
		pipelineLatestLoader := cache.New[model.PipelineKey, *model.Pipeline]()
		projectLoader := cache.New[model.GroupId, []model.Project]()

		skipProjectIds := []int{111, 222}
		cfg := createConfig(t, skipProjectIds, false)

		service := NewProjectService(cfg, projectLoader, pipelineLatestLoader)

		projectLoader.Put(model.GroupId(1),
			[]model.Project{
				{Id: 111, Name: "project-1", DefaultBranch: "master"},
				{Id: 222, Name: "project-2", DefaultBranch: "main"},
				{Id: 333, Name: "project-3", DefaultBranch: "main"},
			},
		)

		pipelineLatestLoader.Put(model.NewPipelineKey(111, "master", nil), &model.Pipeline{Id: 1010, Status: "success"})
		pipelineLatestLoader.Put(model.NewPipelineKey(222, "main", nil), &model.Pipeline{Id: 2020, Status: "success"})
		pipelineLatestLoader.Put(model.NewPipelineKey(333, "main", nil), &model.Pipeline{Id: 3030, Status: "success"})

		result := service.GetProjectsWithLatestPipeline(1)
		assert.Len(t, result, 1)

		success := result["success"]

		assert.Len(t, success, 1)
		assert.Equal(t, "project-3", success[0].Project.Name)
	})
}
