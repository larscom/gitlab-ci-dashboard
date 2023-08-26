package schedule

import (
	"fmt"
	"testing"

	"github.com/larscom/gitlab-ci-dashboard/mock"
	"github.com/stretchr/testify/assert"
)

func TestGetPipelineSchedulesWith1Page(t *testing.T) {
	var (
		totalPages = 1
		client     = NewClient(mock.NewGitlabClient(totalPages, nil))
	)

	schedules := client.GetPipelineSchedules(1)

	assert.Len(t, schedules, 2)
	assert.Equal(t, 1, schedules[0].Id)
	assert.Equal(t, 2, schedules[1].Id)
}

func TestGetPipelineSchedulesWith2Pages(t *testing.T) {
	var (
		totalPages = 2
		client     = NewClient(mock.NewGitlabClient(totalPages, nil))
	)

	schedules := client.GetPipelineSchedules(1)

	assert.Len(t, schedules, 4)
	assert.Equal(t, 1, schedules[0].Id)
	assert.Equal(t, 2, schedules[1].Id)
	assert.Equal(t, 3, schedules[2].Id)
	assert.Equal(t, 4, schedules[3].Id)
}

func TestGetPipelineSchedulesErrorEmptySlice(t *testing.T) {
	client := NewClient(mock.NewGitlabClient(0, fmt.Errorf("ERROR")))

	schedules := client.GetPipelineSchedules(1)

	assert.Len(t, schedules, 0)
}
