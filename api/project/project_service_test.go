package project

import (
	"context"
	"errors"
	"fmt"
	"strings"
	"testing"
	"time"

	"github.com/larscom/gitlab-ci-dashboard/config"
	"github.com/larscom/gitlab-ci-dashboard/model"
	"github.com/larscom/gitlab-ci-dashboard/pipeline"
	ldgc "github.com/larscom/go-loading-cache"

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
			pipelineLatestLoader = ldgc.NewLoadingCache[pipeline.Key, *model.Pipeline](ldgc.NoopLoaderFunc)
			projectsLoader       = ldgc.NewLoadingCache[int, []model.Project](ldgc.NoopLoaderFunc)
			pipelinesLoader      = ldgc.NewLoadingCache[int, []model.Pipeline](ldgc.NoopLoaderFunc)
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
		pipelineLatestLoader.Put(pipeline.NewPipelineKey(333, "main", nil), nil)

		result, err := service.GetProjectsWithLatestPipeline(groupId, context.Background())
		assert.Nil(t, err)
		assert.Len(t, result, 3)

		for _, r := range result {
			if r.Pipeline == nil {
				assert.Equal(t, "project-3", r.Project.Name)
				assert.Equal(t, 333, r.Project.Id)
			} else if r.Pipeline.Status == "success" {
				assert.Equal(t, "project-1", r.Project.Name)
				assert.Equal(t, 111, r.Project.Id)
				assert.Equal(t, 1010, r.Pipeline.Id)
			} else if r.Pipeline.Status == "failed" {
				assert.Equal(t, "project-2", r.Project.Name)
				assert.Equal(t, 222, r.Project.Id)
				assert.Equal(t, 2020, r.Pipeline.Id)
			} else {
				t.Error("failed, this should not happen")
			}
		}
	})

	t.Run("GetProjectsWithLatestPipelineSortedByUpdatedAt", func(t *testing.T) {
		var (
			pipelineLatestLoader = ldgc.NewLoadingCache[pipeline.Key, *model.Pipeline](ldgc.NoopLoaderFunc)
			projectsLoader       = ldgc.NewLoadingCache[int, []model.Project](ldgc.NoopLoaderFunc)
			pipelinesLoader      = ldgc.NewLoadingCache[int, []model.Pipeline](ldgc.NoopLoaderFunc)
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

		result, err := service.GetProjectsWithLatestPipeline(groupId, context.Background())
		assert.NoError(t, err)
		assert.Len(t, result, 5)

		assert.Equal(t, "project-3", result[0].Project.Name)
		assert.Equal(t, 3030, result[0].Pipeline.Id)
		assert.Equal(t, "project-5", result[1].Project.Name)
		assert.Equal(t, 5050, result[1].Pipeline.Id)
		assert.Equal(t, "project-1", result[2].Project.Name)
		assert.Equal(t, 1010, result[2].Pipeline.Id)
	})

	t.Run("GetProjectsWithLatestPipelineErrorProjects", func(t *testing.T) {
		var (
			mockErr              = errors.New("ERROR!")
			pipelineLatestLoader = ldgc.NewLoadingCache[pipeline.Key, *model.Pipeline](ldgc.NoopLoaderFunc)
			projectsLoader       = ldgc.NewLoadingCache[int, []model.Project](func(i int) ([]model.Project, error) {
				return make([]model.Project, 0), mockErr
			})
			pipelinesLoader = ldgc.NewLoadingCache[int, []model.Pipeline](ldgc.NoopLoaderFunc)
			cfg             = createConfig(t, make([]int, 0))
			service         = NewService(cfg, projectsLoader, pipelineLatestLoader, pipelinesLoader)
		)

		result, err := service.GetProjectsWithLatestPipeline(1, context.Background())
		assert.Equal(t, mockErr, err)
		assert.Empty(t, result)
	})

	t.Run("GetProjectsWithLatestPipelineErrorPipeline", func(t *testing.T) {
		var (
			mockErr              = errors.New("ERROR!")
			pipelineLatestLoader = ldgc.NewLoadingCache[pipeline.Key, *model.Pipeline](func(key pipeline.Key) (*model.Pipeline, error) {
				return nil, mockErr
			})
			projectsLoader  = ldgc.NewLoadingCache[int, []model.Project](ldgc.NoopLoaderFunc)
			pipelinesLoader = ldgc.NewLoadingCache[int, []model.Pipeline](ldgc.NoopLoaderFunc)
			cfg             = createConfig(t, make([]int, 0))
			service         = NewService(cfg, projectsLoader, pipelineLatestLoader, pipelinesLoader)
			groupId         = 1
		)

		projectsLoader.Put(groupId,
			[]model.Project{
				{Id: 111, Name: "project-1", DefaultBranch: "master"},
			},
		)

		result, err := service.GetProjectsWithLatestPipeline(groupId, context.Background())
		assert.Equal(t, mockErr, err)
		assert.Empty(t, result)
	})

	t.Run("GetProjectsWithLatestPipelineNilPipeline", func(t *testing.T) {
		var (
			pipelineLatestLoader = ldgc.NewLoadingCache[pipeline.Key, *model.Pipeline](ldgc.NoopLoaderFunc)
			projectsLoader       = ldgc.NewLoadingCache[int, []model.Project](ldgc.NoopLoaderFunc)
			pipelinesLoader      = ldgc.NewLoadingCache[int, []model.Pipeline](ldgc.NoopLoaderFunc)
			cfg                  = createConfig(t, make([]int, 0))
			service              = NewService(cfg, projectsLoader, pipelineLatestLoader, pipelinesLoader)
			groupId              = 1
		)

		projectsLoader.Put(groupId, []model.Project{{Id: 111, Name: "project-1", DefaultBranch: "master"}})

		result, err := service.GetProjectsWithLatestPipeline(groupId, context.Background())
		assert.Nil(t, err)
		assert.Len(t, result, 1)

		assert.Equal(t, "project-1", result[0].Project.Name)
	})

	t.Run("GetProjectsWithLatestPipelineSkipProjectIds", func(t *testing.T) {
		var (
			pipelineLatestLoader = ldgc.NewLoadingCache[pipeline.Key, *model.Pipeline](ldgc.NoopLoaderFunc)
			projectsLoader       = ldgc.NewLoadingCache[int, []model.Project](ldgc.NoopLoaderFunc)
			pipelinesLoader      = ldgc.NewLoadingCache[int, []model.Pipeline](ldgc.NoopLoaderFunc)
			skipProjectIds       = []int{111, 222}
			cfg                  = createConfig(t, skipProjectIds)
			service              = NewService(cfg, projectsLoader, pipelineLatestLoader, pipelinesLoader)
			groupId              = 1
		)

		projectsLoader.Put(groupId, []model.Project{{Id: 111, Name: "project-1", DefaultBranch: "master"}, {Id: 222, Name: "project-2", DefaultBranch: "main"}, {Id: 333, Name: "project-3", DefaultBranch: "main"}})

		pipelineLatestLoader.Put(pipeline.NewPipelineKey(111, "master", nil), &model.Pipeline{Id: 1010, Status: "success"})
		pipelineLatestLoader.Put(pipeline.NewPipelineKey(222, "main", nil), &model.Pipeline{Id: 2020, Status: "success"})
		pipelineLatestLoader.Put(pipeline.NewPipelineKey(333, "main", nil), &model.Pipeline{Id: 3030, Status: "success"})

		result, err := service.GetProjectsWithLatestPipeline(groupId, context.Background())

		assert.Nil(t, err)
		assert.Len(t, result, 1)
		assert.Equal(t, "project-3", result[0].Project.Name)
	})

	t.Run("GetProjectsWithPipelines", func(t *testing.T) {
		var (
			pipelineLatestLoader = ldgc.NewLoadingCache[pipeline.Key, *model.Pipeline](ldgc.NoopLoaderFunc)
			projectsLoader       = ldgc.NewLoadingCache[int, []model.Project](ldgc.NoopLoaderFunc)
			pipelinesLoader      = ldgc.NewLoadingCache[int, []model.Pipeline](ldgc.NoopLoaderFunc)
			cfg                  = createConfig(t, make([]int, 0))
			service              = NewService(cfg, projectsLoader, pipelineLatestLoader, pipelinesLoader)
			groupId              = 1
		)

		projectsLoader.Put(groupId, []model.Project{{Id: 111, Name: "project-1"}, {Id: 222, Name: "project-2"}})

		pipelinesLoader.Put(111, []model.Pipeline{{Ref: "branch-1", Status: "failed"}})
		pipelinesLoader.Put(222, []model.Pipeline{{Ref: "master", Status: "success"}})

		result, err := service.GetProjectsWithPipeline(groupId, context.Background())

		assert.NoError(t, err)
		assert.Len(t, result, 2)

		for _, r := range result {
			if r.Project.Name == "project-1" {
				assert.Equal(t, "branch-1", r.Pipelines[0].Ref)
			} else if r.Project.Name == "project-2" {
				assert.Equal(t, "master", r.Pipelines[0].Ref)
			} else {
				t.Error("failed, this should not happen")
			}
		}
	})

	t.Run("GetProjectsWithPipelinesSkipProjectIds", func(t *testing.T) {
		var (
			pipelineLatestLoader = ldgc.NewLoadingCache[pipeline.Key, *model.Pipeline](ldgc.NoopLoaderFunc)
			projectsLoader       = ldgc.NewLoadingCache[int, []model.Project](ldgc.NoopLoaderFunc)
			pipelinesLoader      = ldgc.NewLoadingCache[int, []model.Pipeline](ldgc.NoopLoaderFunc)
			skipProjectIds       = []int{111}
			cfg                  = createConfig(t, skipProjectIds)
			service              = NewService(cfg, projectsLoader, pipelineLatestLoader, pipelinesLoader)
			groupId              = 1
		)

		projectsLoader.Put(groupId, []model.Project{{Id: 111, Name: "project-1"}, {Id: 222, Name: "project-2"}})

		pipelinesLoader.Put(111, []model.Pipeline{{Ref: "branch-1", Status: "failed"}})
		pipelinesLoader.Put(222, []model.Pipeline{{Ref: "master", Status: "success"}})

		result, err := service.GetProjectsWithPipeline(groupId, context.Background())
		assert.NoError(t, err)
		assert.Len(t, result, 1)

		assert.Equal(t, 222, result[0].Project.Id)
		assert.Equal(t, "master", result[0].Pipelines[0].Ref)
	})

	t.Run("GetProjectsWithPipelineErrorProjects", func(t *testing.T) {
		var (
			mockErr              = errors.New("ERROR!")
			pipelineLatestLoader = ldgc.NewLoadingCache[pipeline.Key, *model.Pipeline](ldgc.NoopLoaderFunc)
			projectsLoader       = ldgc.NewLoadingCache[int, []model.Project](func(i int) ([]model.Project, error) {
				return make([]model.Project, 0), mockErr
			})
			pipelinesLoader = ldgc.NewLoadingCache[int, []model.Pipeline](ldgc.NoopLoaderFunc)
			cfg             = createConfig(t, make([]int, 0))
			service         = NewService(cfg, projectsLoader, pipelineLatestLoader, pipelinesLoader)
		)

		result, err := service.GetProjectsWithPipeline(1, context.Background())
		assert.Equal(t, mockErr, err)
		assert.Empty(t, result)
	})

	t.Run("GetProjectsWithPipelineErrorPipeline", func(t *testing.T) {
		var (
			mockErr              = errors.New("ERROR!")
			pipelineLatestLoader = ldgc.NewLoadingCache[pipeline.Key, *model.Pipeline](ldgc.NoopLoaderFunc)
			projectsLoader       = ldgc.NewLoadingCache[int, []model.Project](ldgc.NoopLoaderFunc)
			pipelinesLoader      = ldgc.NewLoadingCache[int, []model.Pipeline](func(i int) ([]model.Pipeline, error) {
				return make([]model.Pipeline, 0), mockErr
			})
			cfg     = createConfig(t, make([]int, 0))
			service = NewService(cfg, projectsLoader, pipelineLatestLoader, pipelinesLoader)
			groupId = 1
		)

		projectsLoader.Put(groupId,
			[]model.Project{
				{Id: 111, Name: "project-1", DefaultBranch: "master"},
			},
		)

		result, err := service.GetProjectsWithPipeline(groupId, context.Background())
		assert.Equal(t, mockErr, err)
		assert.Empty(t, result)
	})
}
