package branch

import (
	"io"
	"net/http/httptest"
	"testing"

	"github.com/goccy/go-json"

	"github.com/gofiber/fiber/v2"
	"github.com/larscom/gitlab-ci-dashboard/model"
	"github.com/stretchr/testify/assert"
)

type MockBranchService struct{}

func (s *MockBranchService) GetBranchesWithLatestPipeline(projectId int) []*model.BranchPipeline {
	if projectId == 1 {
		return []*model.BranchPipeline{{Branch: &model.Branch{Name: "feature-1"}}}
	}
	return make([]*model.BranchPipeline, 0)
}

func TestGetByProjectId(t *testing.T) {
	app := fiber.New()
	app.Get("/:projectId", NewBranchHandler(&MockBranchService{}).HandleGetBranchesWithLatestPipeline)

	resp, _ := app.Test(httptest.NewRequest("GET", "/1", nil), -1)
	body, _ := io.ReadAll(resp.Body)

	result := make([]*model.BranchPipeline, 0)
	json.Unmarshal(body, &result)

	assert.Equal(t, fiber.StatusOK, resp.StatusCode)
	assert.Len(t, result, 1)
	assert.Equal(t, result[0].Branch.Name, "feature-1")
}

func TestGetByProjectIdNoMatch(t *testing.T) {
	app := fiber.New()
	app.Get("/:projectId", NewBranchHandler(&MockBranchService{}).HandleGetBranchesWithLatestPipeline)

	resp, _ := app.Test(httptest.NewRequest("GET", "/123", nil), -1)
	body, _ := io.ReadAll(resp.Body)

	result := make([]*model.BranchPipeline, 0)
	json.Unmarshal(body, &result)

	assert.Equal(t, fiber.StatusOK, resp.StatusCode)
	assert.Len(t, result, 0)
}

func TestBadRequest(t *testing.T) {
	app := fiber.New()
	app.Get("/:projectId", NewBranchHandler(&MockBranchService{}).HandleGetBranchesWithLatestPipeline)

	resp, _ := app.Test(httptest.NewRequest("GET", "/nan", nil), -1)

	assert.Equal(t, fiber.StatusBadRequest, resp.StatusCode)
}
