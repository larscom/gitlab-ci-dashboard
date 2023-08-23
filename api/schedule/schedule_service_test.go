package schedule

import (
	"testing"

	"github.com/larscom/gitlab-ci-dashboard/model"
	"github.com/larscom/go-cache"
	"github.com/stretchr/testify/assert"
)

func TestGetSchedules(t *testing.T) {
	var (
		pipelineLatestLoader = cache.New[model.PipelineKey, *model.Pipeline]()
		schedulesLoader      = cache.New[model.ProjectId, []model.Schedule]()
		projectsLoader       = cache.New[model.GroupId, []model.Project]()
		service              = NewScheduleService(projectsLoader, schedulesLoader, pipelineLatestLoader)
		groupId              = 1
		projectId            = 22
		ref                  = "master"
		source               = "schedule"
	)

	projectsLoader.Put(model.GroupId(groupId),
		[]model.Project{
			{Id: projectId, Name: "project-1"},
		},
	)
	schedulesLoader.Put(model.ProjectId(projectId), []model.Schedule{{Id: 3, Ref: ref}, {Id: 4, Ref: "nope"}})
	pipelineLatestLoader.Put(model.NewPipelineKey(projectId, ref, &source), &model.Pipeline{Id: 10, Status: "success"})

	result := service.GetSchedules(groupId)

	assert.Len(t, result, 2)
	assert.Equal(t, 3, result[0].Schedule.Id)
	assert.Equal(t, "success", result[0].Pipeline.Status)

	assert.Equal(t, 4, result[1].Schedule.Id)
	assert.Nil(t, result[1].Pipeline)
}
