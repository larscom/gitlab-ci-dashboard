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

	clients := &Clients{
		groupClient:    mock.NewMockGroupClient(),
		projectClient:  mock.NewMockProjectClient(),
		pipelineClient: mock.NewMockPipelineClient(),
		branchClient:   mock.NewMockBranchClient(),
	}

	config := createConfig(t)
	caches := NewCaches(config, clients)
	server := NewServer(NewBootstrap(config, mock.NewMockGitlabClient(1, nil), caches, clients))

	t.Run("TestVersionEndpoint", func(t *testing.T) {
		resp, _ := server.Test(httptest.NewRequest("GET", "/api/version", nil), -1)
		body, _ := io.ReadAll(resp.Body)

		assert.Equal(t, fiber.StatusOK, resp.StatusCode)
		assert.Equal(t, "3.0.0", string(body))
	})

	t.Run("TestGroupsEndpoint", func(t *testing.T) {
		resp, _ := server.Test(httptest.NewRequest("GET", "/api/groups", nil), -1)
		body, _ := io.ReadAll(resp.Body)

		groups := make([]*model.Group, 0)
		err := json.Unmarshal(body, &groups)
		if err != nil {
			t.Fatal(err.Error())
		}

		assert.Equal(t, fiber.StatusOK, resp.StatusCode)
		assert.Len(t, groups, 3)
		assert.Equal(t, "A", groups[0].Name)
	})

	t.Run("TestProjectsGroupedByStatusEndpoint", func(t *testing.T) {
		resp, _ := server.Test(httptest.NewRequest("GET", "/api/groups/123/projects", nil), -1)
		body, _ := io.ReadAll(resp.Body)

		projectsGroupedByStatus := make(map[string][]*model.ProjectPipeline)
		err := json.Unmarshal(body, &projectsGroupedByStatus)
		if err != nil {
			t.Fatal(err.Error())
		}

		success := projectsGroupedByStatus["success"]

		assert.Equal(t, fiber.StatusOK, resp.StatusCode)
		assert.Len(t, success, 1)
		assert.Equal(t, "project-1", success[0].Project.Name)
		assert.Equal(t, "success", success[0].Pipeline.Status)
	})

	t.Run("TestBranchesEndpoint", func(t *testing.T) {
		resp, _ := server.Test(httptest.NewRequest("GET", "/api/branches/123", nil), -1)
		body, _ := io.ReadAll(resp.Body)

		branchesWithPipeline := make([]*model.BranchPipeline, 0)
		err := json.Unmarshal(body, &branchesWithPipeline)
		if err != nil {
			t.Fatal(err.Error())
		}

		assert.Equal(t, fiber.StatusOK, resp.StatusCode)
		assert.Len(t, branchesWithPipeline, 1)
		assert.Equal(t, "branch-1", branchesWithPipeline[0].Branch.Name)
		assert.Equal(t, "success", branchesWithPipeline[0].Pipeline.Status)
	})

	t.Run("TestPipelineEndpoint", func(t *testing.T) {
		resp, _ := server.Test(httptest.NewRequest("GET", "/api/pipelines/123/master", nil), -1)
		body, _ := io.ReadAll(resp.Body)

		pipeline := new(model.Pipeline)
		err := json.Unmarshal(body, &pipeline)
		if err != nil {
			t.Fatal(err.Error())
		}

		assert.Equal(t, fiber.StatusOK, resp.StatusCode)
		assert.Equal(t, "success", pipeline.Status)
		assert.Equal(t, 123, pipeline.ProjectId)
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
