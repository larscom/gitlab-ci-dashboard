package schedule

import (
	"testing"

	"github.com/larscom/gitlab-ci-dashboard/model"
	"github.com/larscom/go-cache"
	"github.com/stretchr/testify/assert"
)

func TestGetSchedules(t *testing.T) {
	pipelineLatestLoader := cache.New[model.PipelineKey, *model.Pipeline]()
	scheduleLoader := cache.New[model.ProjectId, []*model.Schedule]()
	projectLoader := cache.New[model.GroupId, []*model.Project]()

	service := NewScheduleService(projectLoader, scheduleLoader, pipelineLatestLoader)
	groupId := 1

	projectId := 22
	projectLoader.Put(model.GroupId(groupId),
		[]*model.Project{
			{Id: projectId, Name: "project-1"},
		},
	)

	ref := "master"
	source := "schedule"
	scheduleLoader.Put(model.ProjectId(projectId), []*model.Schedule{{Id: 3, Ref: ref}, {Id: 4, Ref: "nope"}})

	pipelineLatestLoader.Put(model.NewPipelineKey(projectId, ref, &source), &model.Pipeline{Id: 10, Status: "success"})

	schedules := service.GetSchedules(groupId)

	assert.Len(t, schedules, 2)
	assert.Equal(t, 3, schedules[0].Id)
	assert.Equal(t, "success", schedules[0].PipelineStatus)

	assert.Equal(t, 4, schedules[1].Id)
	assert.Equal(t, "unknown", schedules[1].PipelineStatus)
}
