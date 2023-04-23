package pipeline

import (
	"fmt"
	"testing"

	"github.com/larscom/gitlab-ci-dashboard/mock"
	"github.com/stretchr/testify/assert"
)

func TestGetLatestPipeline(t *testing.T) {
	client := NewPipelineClient(mock.NewMockGitlabClient(1, nil))

	pipeline, err := client.GetLatestPipeline(1, "master")
	assert.NoError(t, err)
	assert.Equal(t, 123, pipeline.Id)
}

func TestGetLatestPipelineError(t *testing.T) {
	client := NewPipelineClient(mock.NewMockGitlabClient(1, nil))

	pipeline, err := client.GetLatestPipeline(0, "master")
	assert.Error(t, err)
	assert.Nil(t, pipeline)
}

func TestGetLatestPipelineBySourceError(t *testing.T) {
	client := NewPipelineClient(mock.NewMockGitlabClient(1, nil))

	pipeline, err := client.GetLatestPipelineBySource(0, "master", "schedule")
	assert.Error(t, err)
	assert.Nil(t, pipeline)
}

func TestGetLatestPipelineBySourceErrorNotFound(t *testing.T) {
	client := NewPipelineClient(mock.NewMockGitlabClient(1, nil))

	pipeline, err := client.GetLatestPipelineBySource(1, "master", "web")
	assert.Error(t, err)
	assert.Equal(t, fmt.Errorf("no pipelines found for project: 1 and branch: master"), err)
	assert.Nil(t, pipeline)
}

func TestGetLatestPipelineBySource(t *testing.T) {
	client := NewPipelineClient(mock.NewMockGitlabClient(1, nil))

	pipeline, err := client.GetLatestPipelineBySource(1, "master", "schedule")
	assert.NoError(t, err)
	assert.Equal(t, 456, pipeline.Id)
}
