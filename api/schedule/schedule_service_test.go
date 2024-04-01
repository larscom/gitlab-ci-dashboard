package schedule

import (
	"context"
	"errors"
	"fmt"
	"strings"
	"testing"

	"github.com/larscom/gitlab-ci-dashboard/config"
	"github.com/larscom/gitlab-ci-dashboard/model"
	"github.com/larscom/gitlab-ci-dashboard/pipeline"
	"github.com/stretchr/testify/assert"

	ldgc "github.com/larscom/go-loading-cache"
)

func TestScheduleServiceWithConfig(t *testing.T) {
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

	t.Run("GetSchedules", func(t *testing.T) {
		var (
			pipelineLatestLoader = ldgc.NewLoadingCache[pipeline.Key, *model.Pipeline](ldgc.NoopLoaderFunc)
			schedulesLoader      = ldgc.NewLoadingCache[int, []model.Schedule](ldgc.NoopLoaderFunc)
			projectsLoader       = ldgc.NewLoadingCache[int, []model.Project](ldgc.NoopLoaderFunc)
			cfg                  = createConfig(t, make([]int, 0))
			service              = NewService(cfg, projectsLoader, schedulesLoader, pipelineLatestLoader)
			groupId              = 1
			projectId            = 22
			ref                  = "master"
			source               = "schedule"
		)

		projectsLoader.Put(groupId,
			[]model.Project{
				{Id: projectId, Name: "project-1"},
			},
		)
		schedulesLoader.Put(projectId, []model.Schedule{{Id: 3, Ref: ref}, {Id: 4, Ref: "nope"}})
		pipelineLatestLoader.Put(pipeline.NewPipelineKey(projectId, ref, &source), &model.Pipeline{Id: 10, Status: "success"})

		result, err := service.GetSchedules(groupId, context.Background())
		assert.Nil(t, err)

		assert.Len(t, result, 2)
		assert.Equal(t, 3, result[0].Schedule.Id)
		assert.Equal(t, "success", result[0].Pipeline.Status)

		assert.Equal(t, 4, result[1].Schedule.Id)
		assert.Nil(t, result[1].Pipeline)
	})

	t.Run("GetSchedulesWithProjectFilter", func(t *testing.T) {
		var (
			pipelineLatestLoader = ldgc.NewLoadingCache[pipeline.Key, *model.Pipeline](ldgc.NoopLoaderFunc)
			schedulesLoader      = ldgc.NewLoadingCache[int, []model.Schedule](ldgc.NoopLoaderFunc)
			projectsLoader       = ldgc.NewLoadingCache[int, []model.Project](ldgc.NoopLoaderFunc)
			projectIdSkipped     = 33
			cfg                  = createConfig(t, []int{projectIdSkipped})
			service              = NewService(cfg, projectsLoader, schedulesLoader, pipelineLatestLoader)
			groupId              = 1
			projectId            = 22
			ref                  = "master"
			source               = "schedule"
		)

		projectsLoader.Put(groupId,
			[]model.Project{
				{Id: projectId, Name: "project-1"},
				{Id: projectIdSkipped, Name: "project-2"},
			},
		)
		schedulesLoader.Put(projectId, []model.Schedule{{Id: 3, Ref: ref}})
		pipelineLatestLoader.Put(pipeline.NewPipelineKey(projectId, ref, &source), &model.Pipeline{Id: 10, Status: "success"})

		schedulesLoader.Put(projectIdSkipped, []model.Schedule{{Id: 5, Ref: ref}})
		pipelineLatestLoader.Put(pipeline.NewPipelineKey(projectIdSkipped, ref, &source), &model.Pipeline{Id: 11, Status: "success"})

		result, err := service.GetSchedules(groupId, context.Background())
		assert.Nil(t, err)

		assert.Len(t, result, 1)
		assert.Equal(t, 3, result[0].Schedule.Id)
		assert.Equal(t, 10, result[0].Pipeline.Id)
	})

	t.Run("GetSchedulesProjectsError", func(t *testing.T) {
		var (
			mockErr              = errors.New("ERROR!")
			pipelineLatestLoader = ldgc.NewLoadingCache[pipeline.Key, *model.Pipeline](ldgc.NoopLoaderFunc)
			schedulesLoader      = ldgc.NewLoadingCache[int, []model.Schedule](ldgc.NoopLoaderFunc)
			projectsLoader       = ldgc.NewLoadingCache[int, []model.Project](func(i int) ([]model.Project, error) {
				return make([]model.Project, 0), mockErr
			})
			cfg     = createConfig(t, make([]int, 0))
			service = NewService(cfg, projectsLoader, schedulesLoader, pipelineLatestLoader)
		)

		result, err := service.GetSchedules(1, context.Background())
		assert.Equal(t, mockErr, err)
		assert.Empty(t, result)
	})

	t.Run("GetSchedulesError", func(t *testing.T) {
		var (
			mockErr              = errors.New("ERROR!")
			pipelineLatestLoader = ldgc.NewLoadingCache[pipeline.Key, *model.Pipeline](ldgc.NoopLoaderFunc)
			schedulesLoader      = ldgc.NewLoadingCache[int, []model.Schedule](func(i int) ([]model.Schedule, error) {
				return make([]model.Schedule, 0), mockErr
			})
			projectsLoader = ldgc.NewLoadingCache[int, []model.Project](ldgc.NoopLoaderFunc)
			cfg            = createConfig(t, make([]int, 0))
			service        = NewService(cfg, projectsLoader, schedulesLoader, pipelineLatestLoader)
			groupId        = 1
			projectId      = 22
		)

		projectsLoader.Put(groupId,
			[]model.Project{
				{Id: projectId, Name: "project-1"},
			},
		)

		result, err := service.GetSchedules(groupId, context.Background())
		assert.Equal(t, mockErr, err)
		assert.Empty(t, result)
	})
}
