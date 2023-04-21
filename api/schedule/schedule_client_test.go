package schedule

import (
	"fmt"
	"testing"

	"github.com/larscom/gitlab-ci-dashboard/mock"
	"github.com/stretchr/testify/assert"
)

func TestGetPipelineSchedulesWith1Page(t *testing.T) {

	const totalPages = 1
	client := NewScheduleClient(mock.NewMockGitlabClient(totalPages, nil))

	schedules := client.GetPipelineSchedules(1)

	assert.Len(t, schedules, 2)
	assert.Equal(t, 1, schedules[0].Id)
	assert.Equal(t, 2, schedules[1].Id)
}

func TestGetPipelineSchedulesWith2Pages(t *testing.T) {

	const totalPages = 2
	client := NewScheduleClient(mock.NewMockGitlabClient(totalPages, nil))

	schedules := client.GetPipelineSchedules(1)

	assert.Len(t, schedules, 4)
	assert.Equal(t, 1, schedules[0].Id)
	assert.Equal(t, 2, schedules[1].Id)
	assert.Equal(t, 3, schedules[2].Id)
	assert.Equal(t, 4, schedules[3].Id)
}

func TestGetPipelineSchedulesErrorEmptySlice(t *testing.T) {
	client := NewScheduleClient(mock.NewMockGitlabClient(1, fmt.Errorf("ERROR")))

	schedules := client.GetPipelineSchedules(1)

	assert.Len(t, schedules, 0)
}
