package schedule

import (
	"fmt"
	"github.com/larscom/gitlab-ci-dashboard/model"
	"github.com/larscom/gitlab-ci-dashboard/schedule/mock"

	"testing"

	"github.com/stretchr/testify/assert"
)

func TestGetPipelineSchedulesWith1Page(t *testing.T) {
	var (
		totalPages = 1
		client     = NewClient(mock.NewGitlabClientMock(totalPages, nil))
	)

	schedules, _ := client.GetPipelineSchedules(1)

	assert.Len(t, schedules, 2)
	assert.Equal(t, model.ScheduleId(1), schedules[0].Id)
	assert.Equal(t, model.ScheduleId(2), schedules[1].Id)
}

func TestGetPipelineSchedulesWith2Pages(t *testing.T) {
	var (
		totalPages = 2
		client     = NewClient(mock.NewGitlabClientMock(totalPages, nil))
	)

	schedules, _ := client.GetPipelineSchedules(1)

	assert.Len(t, schedules, 4)
	assert.Equal(t, model.ScheduleId(1), schedules[0].Id)
	assert.Equal(t, model.ScheduleId(2), schedules[1].Id)
	assert.Equal(t, model.ScheduleId(3), schedules[2].Id)
	assert.Equal(t, model.ScheduleId(4), schedules[3].Id)
}

func TestGetPipelineSchedulesErrorEmptySlice(t *testing.T) {
	client := NewClient(mock.NewGitlabClientMock(0, fmt.Errorf("ERROR")))

	schedules, _ := client.GetPipelineSchedules(1)

	assert.Len(t, schedules, 0)
}
