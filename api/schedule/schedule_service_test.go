package schedule

import (
	"github.com/larscom/gitlab-ci-dashboard/data"
	"github.com/larscom/gitlab-ci-dashboard/pipeline"
	"testing"

	"github.com/larscom/go-cache"
	"github.com/stretchr/testify/assert"
)

func TestGetSchedules(t *testing.T) {
	var (
		pipelineLatestLoader = cache.New[pipeline.Key, *data.Pipeline]()
		schedulesLoader      = cache.New[int, []data.Schedule]()
		projectsLoader       = cache.New[int, []data.Project]()
		service              = NewService(projectsLoader, schedulesLoader, pipelineLatestLoader)
		groupId              = 1
		projectId            = 22
		ref                  = "master"
		source               = "schedule"
	)

	projectsLoader.Put(groupId,
		[]data.Project{
			{Id: projectId, Name: "project-1"},
		},
	)
	schedulesLoader.Put(projectId, []data.Schedule{{Id: 3, Ref: ref}, {Id: 4, Ref: "nope"}})
	pipelineLatestLoader.Put(pipeline.NewPipelineKey(projectId, ref, &source), &data.Pipeline{Id: 10, Status: "success"})

	result := service.GetSchedules(groupId)

	assert.Len(t, result, 2)
	assert.Equal(t, 3, result[0].Schedule.Id)
	assert.Equal(t, "success", result[0].Pipeline.Status)

	assert.Equal(t, 4, result[1].Schedule.Id)
	assert.Nil(t, result[1].Pipeline)
}
