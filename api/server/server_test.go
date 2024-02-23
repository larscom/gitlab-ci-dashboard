package server

import (
	"io"
	"net/http/httptest"
	"testing"

	"github.com/goccy/go-json"
	"github.com/gofiber/fiber/v2"
	branch "github.com/larscom/gitlab-ci-dashboard/branch/mock"
	"github.com/larscom/gitlab-ci-dashboard/config"
	group "github.com/larscom/gitlab-ci-dashboard/group/mock"
	"github.com/larscom/gitlab-ci-dashboard/model"
	pipeline "github.com/larscom/gitlab-ci-dashboard/pipeline/mock"
	project "github.com/larscom/gitlab-ci-dashboard/project/mock"
	schedule "github.com/larscom/gitlab-ci-dashboard/schedule/mock"
	"github.com/stretchr/testify/assert"
)

func TestServerWithConfig(t *testing.T) {
	createConfig := func(t *testing.T) *config.GitlabConfig {
		t.Setenv("GITLAB_BASE_URL", "http://gitlab.fake")
		t.Setenv("GITLAB_API_TOKEN", "abc123")
		t.Setenv("VERSION", "3.0.0")
		return config.NewGitlabConfig()
	}

	var (
		clients = &Clients{
			groupClient:    &group.ClientMock{},
			projectClient:  &project.ClientMock{},
			pipelineClient: &pipeline.ClientMock{},
			branchClient:   &branch.ClientMock{},
			scheduleClient: &schedule.ClientMock{},
		}
		cfg    = createConfig(t)
		caches = NewCaches(cfg, clients)
		server = NewServer(NewBootstrap(cfg, caches, clients))
	)

	t.Run("TestVersionEndpoint", func(t *testing.T) {
		resp, _ := server.Test(httptest.NewRequest("GET", "/api/version", nil), -1)
		body, _ := io.ReadAll(resp.Body)

		assert.Equal(t, fiber.StatusOK, resp.StatusCode)
		assert.Equal(t, "3.0.0", string(body))
	})

	t.Run("TestGroupsEndpoint", func(t *testing.T) {
		resp, _ := server.Test(httptest.NewRequest("GET", "/api/groups", nil), -1)
		body, _ := io.ReadAll(resp.Body)

		groups := make([]model.Group, 0)
		err := json.Unmarshal(body, &groups)
		if err != nil {
			t.Fatal(err.Error())
		}

		assert.Equal(t, fiber.StatusOK, resp.StatusCode)
		assert.Len(t, groups, 3)
		assert.Equal(t, "A", groups[0].Name)
	})

	t.Run("TestProjectsLatestPipelinesEndpoint", func(t *testing.T) {
		resp, _ := server.Test(httptest.NewRequest("GET", "/api/projects/latest-pipelines?groupId=123", nil), -1)
		body, _ := io.ReadAll(resp.Body)

		result := make([]model.ProjectLatestPipeline, 0)
		err := json.Unmarshal(body, &result)
		if err != nil {
			t.Fatal(err.Error())
		}

		assert.Equal(t, fiber.StatusOK, resp.StatusCode)
		assert.Len(t, result, 1)
		assert.Equal(t, "project-1", result[0].Project.Name)
		assert.Equal(t, "success", result[0].Pipeline.Status)
	})

	t.Run("TestProjectsPipelinesEndpoint", func(t *testing.T) {
		resp, _ := server.Test(httptest.NewRequest("GET", "/api/projects/pipelines?groupId=123", nil), -1)
		body, _ := io.ReadAll(resp.Body)

		result := make([]model.ProjectPipelines, 0)

		err := json.Unmarshal(body, &result)
		if err != nil {
			t.Fatal(err.Error())
		}

		assert.Len(t, result, 1)
		assert.Equal(t, "success", result[0].Pipelines[0].Status)
		assert.Equal(t, "failed", result[0].Pipelines[1].Status)
	})

	t.Run("TestBranchesLatestPipelinesEndpoint", func(t *testing.T) {
		resp, _ := server.Test(httptest.NewRequest("GET", "/api/branches/latest-pipelines?projectId=123", nil), -1)
		body, _ := io.ReadAll(resp.Body)

		result := make([]model.BranchLatestPipeline, 0)

		err := json.Unmarshal(body, &result)
		if err != nil {
			t.Fatal(err.Error())
		}

		assert.Equal(t, fiber.StatusOK, resp.StatusCode)
		assert.Len(t, result, 1)
		assert.Equal(t, "branch-1", result[0].Branch.Name)
		assert.Equal(t, "success", result[0].Pipeline.Status)
	})

	t.Run("TestSchedulesEndpoint", func(t *testing.T) {
		resp, _ := server.Test(httptest.NewRequest("GET", "/api/schedules?groupId=333", nil), -1)
		body, _ := io.ReadAll(resp.Body)

		result := make([]model.ScheduleProjectLatestPipeline, 0)

		err := json.Unmarshal(body, &result)
		if err != nil {
			t.Fatal(err.Error())
		}

		assert.Equal(t, fiber.StatusOK, resp.StatusCode)
		assert.Len(t, result, 1)
		assert.Equal(t, 777, result[0].Schedule.Id)
	})

	t.Run("TestMetricsEndpoint", func(t *testing.T) {
		resp, _ := server.Test(httptest.NewRequest("GET", "/metrics", nil), -1)
		body, _ := io.ReadAll(resp.Body)

		assert.Equal(t, fiber.StatusOK, resp.StatusCode)
		assert.Contains(t, string(body), "!DOCTYPE html")
	})

	t.Run("TestMetricsPrometheusEndpoint", func(t *testing.T) {
		resp, _ := server.Test(httptest.NewRequest("GET", "/metrics/prometheus", nil), -1)
		body, _ := io.ReadAll(resp.Body)

		assert.Equal(t, fiber.StatusOK, resp.StatusCode)
		assert.Contains(t, string(body), "go_gc_duration_seconds")
	})
}
