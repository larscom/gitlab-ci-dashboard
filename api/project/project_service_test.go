package project

import (
	"errors"
	"fmt"
	"github.com/larscom/gitlab-ci-dashboard/config"
	"github.com/larscom/gitlab-ci-dashboard/model"
	"github.com/larscom/gitlab-ci-dashboard/pipeline"
	"strings"
	"testing"
	"time"

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
			pipelineLatestLoader = cache.New[pipeline.Key, *model.Pipeline]()
			projectsLoader       = cache.New[int, []model.Project]()
			pipelinesLoader      = cache.New[int, []model.Pipeline]()
			cfg                  = createConfig(t, make([]int, 0))
			service              = NewService(cfg, projectsLoader, pipelineLatestLoader, pipelinesLoader)
			groupId              = 1
		)

		projectsLoader.Put(groupId,
			[]model.Project{
				{Id: 111, Name: "project-1", DefaultBranch: "master"},
				{Id: 222, Name: "project-2", DefaultBranch: "main"},
				{Id: 333, Name: "project-3", DefaultBranch: "main"},
			},
		)
		pipelineLatestLoader.Put(pipeline.NewPipelineKey(111, "master", nil), &model.Pipeline{Id: 1010, Status: "success"})
		pipelineLatestLoader.Put(pipeline.NewPipelineKey(222, "main", nil), &model.Pipeline{Id: 2020, Status: "failed"})
		pipelineLatestLoader.Put(pipeline.NewPipelineKey(333, "main", nil), &model.Pipeline{Id: 3030, Status: "success"})

		result, err := service.GetProjectsWithLatestPipeline(groupId)
		assert.Nil(t, err)
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
				t.Error("expected projectId 111 and projectId 333")
			}
		}

		failed := result["failed"]
		assert.Len(t, failed, 1)
		assert.Equal(t, "project-2", failed[0].Project.Name)
		assert.Equal(t, 222, failed[0].Project.Id)
		assert.Equal(t, 2020, failed[0].Pipeline.Id)
		assert.Equal(t, "failed", failed[0].Pipeline.Status)
	})

	t.Run("GetProjectsWithLatestPipelineSortedByUpdatedAt", func(t *testing.T) {
		var (
			pipelineLatestLoader = cache.New[pipeline.Key, *model.Pipeline]()
			projectsLoader       = cache.New[int, []model.Project]()
			pipelinesLoader      = cache.New[int, []model.Pipeline]()
			cfg                  = createConfig(t, make([]int, 0))
			service              = NewService(cfg, projectsLoader, pipelineLatestLoader, pipelinesLoader)
			groupId              = 1
			now                  = time.Now()
		)

		projectsLoader.Put(groupId,
			[]model.Project{
				{Id: 111, Name: "project-1", DefaultBranch: "master"},
				{Id: 222, Name: "project-2", DefaultBranch: "master"},
				{Id: 333, Name: "project-3", DefaultBranch: "master"},
				{Id: 444, Name: "project-4", DefaultBranch: "master"},
				{Id: 555, Name: "project-5", DefaultBranch: "master"},
			},
		)
		pipelineLatestLoader.Put(pipeline.NewPipelineKey(111, "master", nil), &model.Pipeline{Id: 1010, Status: "success", UpdatedAt: now.Add(-10 * time.Minute)})
		pipelineLatestLoader.Put(pipeline.NewPipelineKey(222, "master", nil), nil)
		pipelineLatestLoader.Put(pipeline.NewPipelineKey(333, "master", nil), &model.Pipeline{Id: 3030, Status: "success", UpdatedAt: now.Add(-2 * time.Minute)})
		pipelineLatestLoader.Put(pipeline.NewPipelineKey(444, "master", nil), nil)
		pipelineLatestLoader.Put(pipeline.NewPipelineKey(555, "master", nil), &model.Pipeline{Id: 5050, Status: "success", UpdatedAt: now.Add(-5 * time.Minute)})

		result, err := service.GetProjectsWithLatestPipeline(groupId)
		assert.NoError(t, err)

		success := result["success"]

		assert.Len(t, success, 3)
		assert.Equal(t, "project-3", success[0].Project.Name)
		assert.Equal(t, 3030, success[0].Pipeline.Id)
		assert.Equal(t, "project-5", success[1].Project.Name)
		assert.Equal(t, 5050, success[1].Pipeline.Id)
		assert.Equal(t, "project-1", success[2].Project.Name)
		assert.Equal(t, 1010, success[2].Pipeline.Id)
	})

	t.Run("GetProjectsWithLatestPipelineErrorProjects", func(t *testing.T) {
		var (
			mockErr              = errors.New("ERROR!")
			pipelineLatestLoader = cache.New[pipeline.Key, *model.Pipeline]()
			projectsLoader       = cache.New[int, []model.Project](cache.WithLoader[int, []model.Project](func(i int) ([]model.Project, error) {
				return make([]model.Project, 0), mockErr
			}))
			pipelinesLoader = cache.New[int, []model.Pipeline]()
			cfg             = createConfig(t, make([]int, 0))
			service         = NewService(cfg, projectsLoader, pipelineLatestLoader, pipelinesLoader)
		)

		result, err := service.GetProjectsWithLatestPipeline(1)
		assert.Equal(t, mockErr, err)
		assert.Empty(t, result)
	})

	t.Run("GetProjectsWithLatestPipelineErrorPipeline", func(t *testing.T) {
		var (
			mockErr              = errors.New("ERROR!")
			pipelineLatestLoader = cache.New[pipeline.Key, *model.Pipeline](cache.WithLoader[pipeline.Key, *model.Pipeline](func(key pipeline.Key) (*model.Pipeline, error) {
				return nil, mockErr
			}))
			projectsLoader  = cache.New[int, []model.Project]()
			pipelinesLoader = cache.New[int, []model.Pipeline]()
			cfg             = createConfig(t, make([]int, 0))
			service         = NewService(cfg, projectsLoader, pipelineLatestLoader, pipelinesLoader)
			groupId         = 1
		)

		projectsLoader.Put(groupId,
			[]model.Project{
				{Id: 111, Name: "project-1", DefaultBranch: "master"},
			},
		)

		result, err := service.GetProjectsWithLatestPipeline(groupId)
		assert.Equal(t, mockErr, err)
		assert.Empty(t, result)
	})

	t.Run("GetProjectsWithLatestPipelineNilPipeline", func(t *testing.T) {
		var (
			pipelineLatestLoader = cache.New[pipeline.Key, *model.Pipeline](cache.WithLoader[pipeline.Key, *model.Pipeline](func(key pipeline.Key) (*model.Pipeline, error) {
				return nil, nil
			}))
			projectsLoader  = cache.New[int, []model.Project]()
			pipelinesLoader = cache.New[int, []model.Pipeline]()
			cfg             = createConfig(t, make([]int, 0))
			service         = NewService(cfg, projectsLoader, pipelineLatestLoader, pipelinesLoader)
			groupId         = 1
		)

		projectsLoader.Put(groupId,
			[]model.Project{
				{Id: 111, Name: "project-1", DefaultBranch: "master"},
			},
		)

		result, err := service.GetProjectsWithLatestPipeline(groupId)
		assert.Nil(t, err)
		assert.Empty(t, result)
	})

	t.Run("GetProjectsWithLatestPipelineSkipProjectIds", func(t *testing.T) {
		var (
			pipelineLatestLoader = cache.New[pipeline.Key, *model.Pipeline]()
			projectsLoader       = cache.New[int, []model.Project]()
			pipelinesLoader      = cache.New[int, []model.Pipeline]()
			skipProjectIds       = []int{111, 222}
			cfg                  = createConfig(t, skipProjectIds)
			service              = NewService(cfg, projectsLoader, pipelineLatestLoader, pipelinesLoader)
			groupId              = 1
		)

		projectsLoader.Put(groupId,
			[]model.Project{
				{Id: 111, Name: "project-1", DefaultBranch: "master"},
				{Id: 222, Name: "project-2", DefaultBranch: "main"},
				{Id: 333, Name: "project-3", DefaultBranch: "main"},
			},
		)
		pipelineLatestLoader.Put(pipeline.NewPipelineKey(111, "master", nil), &model.Pipeline{Id: 1010, Status: "success"})
		pipelineLatestLoader.Put(pipeline.NewPipelineKey(222, "main", nil), &model.Pipeline{Id: 2020, Status: "success"})
		pipelineLatestLoader.Put(pipeline.NewPipelineKey(333, "main", nil), &model.Pipeline{Id: 3030, Status: "success"})

		result, err := service.GetProjectsWithLatestPipeline(groupId)
		assert.Nil(t, err)
		assert.Len(t, result, 1)

		success := result["success"]

		assert.Len(t, success, 1)
		assert.Equal(t, "project-3", success[0].Project.Name)
	})

	t.Run("GetProjectsWithPipelinesSortedByUpdatedAt", func(t *testing.T) {
		var (
			pipelineLatestLoader = cache.New[pipeline.Key, *model.Pipeline]()
			projectsLoader       = cache.New[int, []model.Project]()
			pipelinesLoader      = cache.New[int, []model.Pipeline]()
			cfg                  = createConfig(t, make([]int, 0))
			service              = NewService(cfg, projectsLoader, pipelineLatestLoader, pipelinesLoader)
			groupId              = 1
			now                  = time.Now()
		)

		projectsLoader.Put(groupId,
			[]model.Project{
				{Id: 111, Name: "project-1"},
				{Id: 222, Name: "project-2"},
			},
		)

		pipelinesLoader.Put(111, []model.Pipeline{
			{
				Ref:       "branch-1",
				Status:    "failed",
				UpdatedAt: now.Add(-20 * time.Minute),
			},
		})
		pipelinesLoader.Put(222, []model.Pipeline{
			{
				Ref:       "master",
				Status:    "success",
				UpdatedAt: now.Add(-10 * time.Minute),
			},
		})

		result, err := service.GetProjectsWithPipeline(groupId)

		assert.NoError(t, err)
		assert.Len(t, result, 2)

		assert.Equal(t, 222, result[0].Project.Id)
		assert.Equal(t, "master", result[0].Pipeline.Ref)

		assert.Equal(t, 111, result[1].Project.Id)
		assert.Equal(t, "branch-1", result[1].Pipeline.Ref)
	})

	t.Run("GetProjectsWithPipelinesSkipProjectIds", func(t *testing.T) {
		var (
			pipelineLatestLoader = cache.New[pipeline.Key, *model.Pipeline]()
			projectsLoader       = cache.New[int, []model.Project]()
			pipelinesLoader      = cache.New[int, []model.Pipeline]()
			skipProjectIds       = []int{111}
			cfg                  = createConfig(t, skipProjectIds)
			service              = NewService(cfg, projectsLoader, pipelineLatestLoader, pipelinesLoader)
			groupId              = 1
		)

		projectsLoader.Put(groupId,
			[]model.Project{
				{Id: 111, Name: "project-1"},
				{Id: 222, Name: "project-2"},
			},
		)

		pipelinesLoader.Put(111, []model.Pipeline{
			{
				Ref:    "branch-1",
				Status: "failed",
			},
		})
		pipelinesLoader.Put(222, []model.Pipeline{
			{
				Ref:    "master",
				Status: "success",
			},
		})

		result, err := service.GetProjectsWithPipeline(groupId)
		assert.NoError(t, err)
		assert.Len(t, result, 1)

		assert.Equal(t, 222, result[0].Project.Id)
		assert.Equal(t, "master", result[0].Pipeline.Ref)
	})

	t.Run("GetProjectsWithPipelineErrorProjects", func(t *testing.T) {
		var (
			mockErr              = errors.New("ERROR!")
			pipelineLatestLoader = cache.New[pipeline.Key, *model.Pipeline]()
			projectsLoader       = cache.New[int, []model.Project](cache.WithLoader[int, []model.Project](func(i int) ([]model.Project, error) {
				return make([]model.Project, 0), mockErr
			}))
			pipelinesLoader = cache.New[int, []model.Pipeline]()
			cfg             = createConfig(t, make([]int, 0))
			service         = NewService(cfg, projectsLoader, pipelineLatestLoader, pipelinesLoader)
		)

		result, err := service.GetProjectsWithPipeline(1)
		assert.Equal(t, mockErr, err)
		assert.Empty(t, result)
	})

	t.Run("GetProjectsWithPipelineErrorPipeline", func(t *testing.T) {
		var (
			mockErr              = errors.New("ERROR!")
			pipelineLatestLoader = cache.New[pipeline.Key, *model.Pipeline]()
			projectsLoader       = cache.New[int, []model.Project]()
			pipelinesLoader      = cache.New[int, []model.Pipeline](cache.WithLoader[int, []model.Pipeline](func(i int) ([]model.Pipeline, error) {
				return make([]model.Pipeline, 0), mockErr
			}))
			cfg     = createConfig(t, make([]int, 0))
			service = NewService(cfg, projectsLoader, pipelineLatestLoader, pipelinesLoader)
			groupId = 1
		)

		projectsLoader.Put(groupId,
			[]model.Project{
				{Id: 111, Name: "project-1", DefaultBranch: "master"},
			},
		)

		result, err := service.GetProjectsWithPipeline(groupId)
		assert.Equal(t, mockErr, err)
		assert.Empty(t, result)
	})
}
