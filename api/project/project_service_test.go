package project

import (
	"fmt"
	"github.com/larscom/gitlab-ci-dashboard/pipeline"
	"strings"
	"testing"

	"github.com/larscom/gitlab-ci-dashboard/config"

	"github.com/larscom/go-cache"
	"github.com/stretchr/testify/assert"
)

func TestProjectServiceWithConfig(t *testing.T) {

	createConfig := func(t *testing.T, skipProjectIds []int) *config.GitlabConfig {
		t.Setenv("GITLAB_BASE_URL", "http://gitlab.fake")
		t.Setenv("GITLAB_API_TOKEN", "abc123")

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
		var (
			pipelineLatestLoader = cache.New[pipeline.Key, *pipeline.Pipeline]()
			projectsLoader       = cache.New[int, []Project]()
			pipelinesLoader      = cache.New[int, []pipeline.Pipeline]()
			cfg                  = createConfig(t, make([]int, 0))
			service              = NewService(cfg, projectsLoader, pipelineLatestLoader, pipelinesLoader)
		)

		projectsLoader.Put(1,
			[]Project{
				{Id: 111, Name: "project-1", DefaultBranch: "master"},
				{Id: 222, Name: "project-2", DefaultBranch: "main"},
				{Id: 333, Name: "project-3", DefaultBranch: "main"},
			},
		)
		pipelineLatestLoader.Put(pipeline.NewPipelineKey(111, "master", nil), &pipeline.Pipeline{Id: 1010, Status: "success"})
		pipelineLatestLoader.Put(pipeline.NewPipelineKey(222, "main", nil), &pipeline.Pipeline{Id: 2020, Status: "failed"})
		pipelineLatestLoader.Put(pipeline.NewPipelineKey(333, "main", nil), &pipeline.Pipeline{Id: 3030, Status: "success"})

		result := service.GetProjectsWithLatestPipeline(1)
		assert.Len(t, result, 2)

		success := result["success"]
		assert.Len(t, success, 2)

		for _, entry := range success {
			if entry.Project.Id == 111 {
				assert.Equal(t, "project-1", entry.Project.Name)
				assert.Equal(t, 1010, entry.Pipeline.Id)
				assert.Equal(t, "success", entry.Pipeline.Status)
			} else if entry.Project.Id == 333 {
				assert.Equal(t, "project-3", entry.Project.Name)
				assert.Equal(t, 3030, entry.Pipeline.Id)
				assert.Equal(t, "success", entry.Pipeline.Status)
			} else {
				t.Errorf("expected projectId 111 and projectId 333")
			}
		}

		failed := result["failed"]
		assert.Len(t, failed, 1)
		assert.Equal(t, "project-2", failed[0].Project.Name)
		assert.Equal(t, 222, failed[0].Project.Id)
		assert.Equal(t, 2020, failed[0].Pipeline.Id)
		assert.Equal(t, "failed", failed[0].Pipeline.Status)
	})

	t.Run("GetProjectsWithLatestPipelineSkipProjectIds", func(t *testing.T) {
		var (
			pipelineLatestLoader = cache.New[pipeline.Key, *pipeline.Pipeline]()
			projectsLoader       = cache.New[int, []Project]()
			pipelinesLoader      = cache.New[int, []pipeline.Pipeline]()
			skipProjectIds       = []int{111, 222}
			cfg                  = createConfig(t, skipProjectIds)
			service              = NewService(cfg, projectsLoader, pipelineLatestLoader, pipelinesLoader)
		)

		projectsLoader.Put(1,
			[]Project{
				{Id: 111, Name: "project-1", DefaultBranch: "master"},
				{Id: 222, Name: "project-2", DefaultBranch: "main"},
				{Id: 333, Name: "project-3", DefaultBranch: "main"},
			},
		)
		pipelineLatestLoader.Put(pipeline.NewPipelineKey(111, "master", nil), &pipeline.Pipeline{Id: 1010, Status: "success"})
		pipelineLatestLoader.Put(pipeline.NewPipelineKey(222, "main", nil), &pipeline.Pipeline{Id: 2020, Status: "success"})
		pipelineLatestLoader.Put(pipeline.NewPipelineKey(333, "main", nil), &pipeline.Pipeline{Id: 3030, Status: "success"})

		result := service.GetProjectsWithLatestPipeline(1)
		assert.Len(t, result, 1)

		success := result["success"]

		assert.Len(t, success, 1)
		assert.Equal(t, "project-3", success[0].Project.Name)
	})
}
