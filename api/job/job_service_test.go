package job

import (
	"errors"
	"testing"
	"time"

	"github.com/larscom/gitlab-ci-dashboard/model"
	"github.com/larscom/go-cache"

	"github.com/stretchr/testify/assert"
)

func TestGetJobs(t *testing.T) {
	var (
		jobsLoader = cache.NewLoadingCache[Key, []model.Job](cache.NoopLoaderFunc)

		service    = NewService(jobsLoader)
		projectId  = 1
		pipelineId = 2
		scope      = []string{"success", "failed"}
	)

	jobsLoader.Put(NewJobKey(projectId, pipelineId, scope), []model.Job{
		{Name: "job-1", Status: "success"},
		{Name: "job-2", Status: "failed"},
	})

	result, err := service.GetJobs(projectId, pipelineId, scope)
	assert.Nil(t, err)
	assert.Len(t, result, 2)

	for _, r := range result {
		if r.Name == "job-1" {
			assert.Equal(t, "success", r.Status)
		} else if r.Name == "job-2" {
			assert.Equal(t, "failed", r.Status)
		} else {
			t.Error("failed, this should not happen")
		}
	}
}

func TestGetJobsSortedByCreatedDate(t *testing.T) {
	var (
		jobsLoader = cache.NewLoadingCache[Key, []model.Job](cache.NoopLoaderFunc)

		service    = NewService(jobsLoader)
		projectId  = 1
		pipelineId = 2
		scope      = []string{}
		now        = time.Now()
	)

	jobsLoader.Put(NewJobKey(projectId, pipelineId, scope), []model.Job{
		{Name: "job-1", Status: "success", CreatedAt: now.Add(-4 * time.Minute)},
		{Name: "job-2", Status: "failed", CreatedAt: now.Add(-5 * time.Minute)},
		{Name: "job-3", Status: "failed", CreatedAt: now.Add(-2 * time.Minute)},
		{Name: "job-4", Status: "failed", CreatedAt: now.Add(-10 * time.Minute)},
	})

	result, err := service.GetJobs(projectId, pipelineId, scope)
	assert.Nil(t, err)
	assert.Len(t, result, 4)

	assert.Equal(t, "job-4", result[0].Name)
	assert.Equal(t, "job-2", result[1].Name)
	assert.Equal(t, "job-1", result[2].Name)
	assert.Equal(t, "job-3", result[3].Name)

}

func TestGetJobsError(t *testing.T) {
	var (
		mockErr    = errors.New("ERROR!")
		jobsLoader = cache.NewLoadingCache[Key, []model.Job](func(i Key) ([]model.Job, error) {
			return make([]model.Job, 0), mockErr
		})

		service    = NewService(jobsLoader)
		projectId  = 1
		pipelineId = 2
		scope      = []string{}
	)

	result, err := service.GetJobs(projectId, pipelineId, scope)
	assert.Equal(t, mockErr, err)
	assert.Empty(t, result)
}
