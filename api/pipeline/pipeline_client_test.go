package pipeline

import (
	"fmt"
	"github.com/larscom/gitlab-ci-dashboard/model"
	"github.com/larscom/gitlab-ci-dashboard/pipeline/mock"

	"testing"

	"github.com/larscom/gitlab-ci-dashboard/config"
	"github.com/stretchr/testify/assert"
)

func TestGetLatestPipeline(t *testing.T) {
	client := NewClient(mock.NewGitlabClientMock(1, nil), nil)

	pipeline, err := client.GetLatestPipeline(1, "master")
	assert.NoError(t, err)
	assert.Equal(t, model.PipelineId(123), pipeline.Id)
}

func TestGetLatestPipelineError(t *testing.T) {
	client := NewClient(mock.NewGitlabClientMock(1, nil), nil)

	pipeline, err := client.GetLatestPipeline(0, "master")
	assert.Error(t, err)
	assert.Nil(t, pipeline)
}

func TestGetLatestPipelineBySourceError(t *testing.T) {
	client := NewClient(mock.NewGitlabClientMock(1, nil), nil)

	pipeline, err := client.GetLatestPipelineBySource(0, "master", "schedule")
	assert.Error(t, err)
	assert.Nil(t, pipeline)
}

func TestGetLatestPipelineBySourceErrorNotFound(t *testing.T) {
	client := NewClient(mock.NewGitlabClientMock(1, nil), nil)

	pipeline, err := client.GetLatestPipelineBySource(1, "master", "web")
	assert.Error(t, err)
	assert.Equal(t, fmt.Errorf("no pipelines found for project: 1 and branch: master"), err)
	assert.Nil(t, pipeline)
}

func TestGetLatestPipelineBySource(t *testing.T) {
	client := NewClient(mock.NewGitlabClientMock(1, nil), nil)

	pipeline, err := client.GetLatestPipelineBySource(1, "master", "schedule")
	assert.NoError(t, err)
	assert.Equal(t, model.PipelineId(456), pipeline.Id)
}

func TestGetPipelinesWith1Page(t *testing.T) {
	var (
		cfg        = createConfig(t, 1)
		totalPages = 1
		client     = NewClient(mock.NewGitlabClientMock(totalPages, nil), cfg)
	)

	pipelines, _ := client.GetPipelines(100)

	assert.Len(t, pipelines, 2)
	assert.Equal(t, model.PipelineId(111), pipelines[0].Id)
	assert.Equal(t, model.PipelineId(222), pipelines[1].Id)
}

func TestGetPipelinesWith2Pages(t *testing.T) {
	var (
		cfg        = createConfig(t, 1)
		totalPages = 2
		client     = NewClient(mock.NewGitlabClientMock(totalPages, nil), cfg)
	)

	pipelines, _ := client.GetPipelines(100)

	assert.Len(t, pipelines, 4)
	assert.Equal(t, model.PipelineId(111), pipelines[0].Id)
	assert.Equal(t, model.PipelineId(222), pipelines[1].Id)
	assert.Equal(t, model.PipelineId(333), pipelines[2].Id)
	assert.Equal(t, model.PipelineId(444), pipelines[3].Id)
}

func TestGetPipelinesWithErrorEmptySlice(t *testing.T) {
	var (
		cfg    = createConfig(t, 1)
		client = NewClient(mock.NewGitlabClientMock(0, fmt.Errorf("ERROR")), cfg)
	)

	pipelines, _ := client.GetPipelines(100)
	assert.Len(t, pipelines, 0)
}

func createConfig(t *testing.T, pipelineHistoryDays int) *config.GitlabConfig {
	t.Setenv("GITLAB_BASE_URL", "http://gitlab.fake")
	t.Setenv("GITLAB_API_TOKEN", "abc123")
	t.Setenv("GITLAB_PIPELINE_HISTORY_DAYS", fmt.Sprintf("%d", pipelineHistoryDays))

	return config.NewGitlabConfig()
}
