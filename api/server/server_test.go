package server

import (
	"io"
	"net/http/httptest"
	"testing"

	"github.com/goccy/go-json"
	"github.com/gofiber/fiber/v2"
	"github.com/larscom/gitlab-ci-dashboard/config"
	"github.com/larscom/gitlab-ci-dashboard/mock"
	"github.com/larscom/gitlab-ci-dashboard/model"
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
			groupClient:    mock.NewGroupClient(),
			projectClient:  mock.NewProjectClient(),
			pipelineClient: mock.NewPipelineClient(),
			branchClient:   mock.NewBranchClient(),
			scheduleClient: mock.NewScheduleClient(),
		}
		cfg    = createConfig(t)
		caches = NewCaches(cfg, clients)
		server = NewServer(NewBootstrap(cfg, mock.NewGitlabClient(0, nil), caches, clients))
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

		result := make(map[string][]model.ProjectWithPipeline)

		err := json.Unmarshal(body, &result)
		if err != nil {
			t.Fatal(err.Error())
		}

		success := result["success"]

		assert.Equal(t, fiber.StatusOK, resp.StatusCode)
		assert.Len(t, success, 1)
		assert.Equal(t, "project-1", success[0].Project.Name)
		assert.Equal(t, "success", success[0].Pipeline.Status)
	})

	t.Run("TestProjectsPipelinesEndpoint", func(t *testing.T) {
		resp, _ := server.Test(httptest.NewRequest("GET", "/api/projects/pipelines?groupId=123", nil), -1)
		body, _ := io.ReadAll(resp.Body)

		result := make([]model.ProjectWithPipeline, 0)

		err := json.Unmarshal(body, &result)
		if err != nil {
			t.Fatal(err.Error())
		}

		assert.Len(t, result, 2)
		assert.Equal(t, "success", result[0].Pipeline.Status)
		assert.Equal(t, "failed", result[1].Pipeline.Status)
	})

	t.Run("TestBranchesLatestPipelinesEndpoint", func(t *testing.T) {
		resp, _ := server.Test(httptest.NewRequest("GET", "/api/branches/latest-pipelines?projectId=123", nil), -1)
		body, _ := io.ReadAll(resp.Body)

		result := make([]model.BranchWithPipeline, 0)

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

		result := make([]model.ScheduleWithProjectAndPipeline, 0)

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
