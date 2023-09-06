package schedule

import (
	"errors"
	"fmt"
	"github.com/larscom/gitlab-ci-dashboard/config"
	"github.com/larscom/gitlab-ci-dashboard/model"
	"github.com/larscom/gitlab-ci-dashboard/pipeline"
	"github.com/stretchr/testify/assert"
	"strings"
	"testing"

	"github.com/larscom/go-cache"
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
			pipelineLatestLoader = cache.New[pipeline.Key, *model.Pipeline]()
			schedulesLoader      = cache.New[int, []model.Schedule]()
			projectsLoader       = cache.New[int, []model.Project]()
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

		result, err := service.GetSchedules(groupId)
		assert.Nil(t, err)

		assert.Len(t, result, 2)
		assert.Equal(t, 3, result[0].Schedule.Id)
		assert.Equal(t, "success", result[0].Pipeline.Status)

		assert.Equal(t, 4, result[1].Schedule.Id)
		assert.Nil(t, result[1].Pipeline)
	})

	t.Run("GetSchedulesProjectsError", func(t *testing.T) {
		var (
			mockErr              = errors.New("ERROR!")
			pipelineLatestLoader = cache.New[pipeline.Key, *model.Pipeline]()
			schedulesLoader      = cache.New[int, []model.Schedule]()
			projectsLoader       = cache.New[int, []model.Project](cache.WithLoader[int, []model.Project](func(i int) ([]model.Project, error) {
				return make([]model.Project, 0), mockErr
			}))
			cfg     = createConfig(t, make([]int, 0))
			service = NewService(cfg, projectsLoader, schedulesLoader, pipelineLatestLoader)
		)

		result, err := service.GetSchedules(1)
		assert.Equal(t, mockErr, err)
		assert.Empty(t, result)
	})

	t.Run("GetSchedulesError", func(t *testing.T) {
		var (
			mockErr              = errors.New("ERROR!")
			pipelineLatestLoader = cache.New[pipeline.Key, *model.Pipeline]()
			schedulesLoader      = cache.New[int, []model.Schedule](cache.WithLoader[int, []model.Schedule](func(i int) ([]model.Schedule, error) {
				return make([]model.Schedule, 0), mockErr
			}))
			projectsLoader = cache.New[int, []model.Project]()
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

		result, err := service.GetSchedules(groupId)
		assert.Equal(t, mockErr, err)
		assert.Empty(t, result)
	})
}
