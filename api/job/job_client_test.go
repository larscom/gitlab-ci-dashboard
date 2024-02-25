package job

import (
	"context"
	"fmt"

	"testing"

	"github.com/larscom/gitlab-ci-dashboard/job/mock"
	"github.com/stretchr/testify/assert"
)

func TestGetJobsWith1Page(t *testing.T) {
	var (
		totalPages = 1
		client     = NewClient(mock.NewGitlabClientMock(totalPages, nil))
	)

	jobs, _ := client.GetJobs(1, 2, []string{"success", "failed"}, context.Background())

	assert.Len(t, jobs, 2)
	assert.Equal(t, "job-1", jobs[0].Name)
	assert.Equal(t, "job-2", jobs[1].Name)
}

func TestGetJobsWith2Pages(t *testing.T) {
	var (
		totalPages = 2
		client     = NewClient(mock.NewGitlabClientMock(totalPages, nil))
	)

	jobs, _ := client.GetJobs(1, 2, []string{"success", "failed"}, context.Background())

	assert.Len(t, jobs, 4)
	assert.Equal(t, "job-1", jobs[0].Name)
	assert.Equal(t, "job-2", jobs[1].Name)
	assert.Equal(t, "job-3", jobs[2].Name)
	assert.Equal(t, "job-4", jobs[3].Name)
}

func TestGetJobsWithErrorEmptySlice(t *testing.T) {
	client := NewClient(mock.NewGitlabClientMock(0, fmt.Errorf("ERROR")))

	jobs, _ := client.GetJobs(1, 2, []string{}, context.Background())

	assert.Len(t, jobs, 0)
}
