package server

import (
	"net/http/httptest"
	"testing"

	"github.com/gofiber/fiber/v2"
	"github.com/larscom/gitlab-ci-dashboard/config"
	"github.com/larscom/gitlab-ci-dashboard/mock"
	"github.com/stretchr/testify/assert"
)

func TestServerWithConfig(t *testing.T) {

	createConfig := func(t *testing.T) *config.GitlabConfig {
		t.Setenv("GITLAB_BASE_URL", "http://gitlab.fake")
		t.Setenv("GITLAB_API_TOKEN", "abc123")
		return config.NewGitlabConfig()
	}

	t.Run("TestGetGroups", func(t *testing.T) {
		cfg := createConfig(t)
		clients := &Clients{
			groupClient:    mock.NewMockGroupClient(),
			projectClient:  mock.NewMockProjectClient(),
			pipelineClient: mock.NewMockPipelineClient(),
			branchClient:   mock.NewMockBranchClient(),
		}
		caches := NewCaches(cfg, clients)
		server := NewServer(NewBootstrap(cfg, mock.NewMockGitlabClient(1, nil), caches, clients))

		resp, _ := server.Test(httptest.NewRequest("GET", "/api/groups", nil), -1)

		assert.Equal(t, fiber.StatusOK, resp.StatusCode)
	})
}
