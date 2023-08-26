package schedule

import (
	"github.com/larscom/gitlab-ci-dashboard/pipeline"
	"github.com/larscom/gitlab-ci-dashboard/project"
	"testing"

	"github.com/larscom/go-cache"
	"github.com/stretchr/testify/assert"
)

func TestGetSchedules(t *testing.T) {
	var (
		pipelineLatestLoader = cache.New[pipeline.Key, *pipeline.Pipeline]()
		schedulesLoader      = cache.New[int, []Schedule]()
		projectsLoader       = cache.New[int, []project.Project]()
		service              = NewService(projectsLoader, schedulesLoader, pipelineLatestLoader)
		groupId              = 1
		projectId            = 22
		ref                  = "master"
		source               = "schedule"
	)

	projectsLoader.Put(groupId,
		[]project.Project{
			{Id: projectId, Name: "project-1"},
		},
	)
	schedulesLoader.Put(projectId, []Schedule{{Id: 3, Ref: ref}, {Id: 4, Ref: "nope"}})
	pipelineLatestLoader.Put(pipeline.NewPipelineKey(projectId, ref, &source), &pipeline.Pipeline{Id: 10, Status: "success"})

	result := service.GetSchedules(groupId)

	assert.Len(t, result, 2)
	assert.Equal(t, 3, result[0].Schedule.Id)
	assert.Equal(t, "success", result[0].Pipeline.Status)

	assert.Equal(t, 4, result[1].Schedule.Id)
	assert.Nil(t, result[1].Pipeline)
}
