package pipeline

import (
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
