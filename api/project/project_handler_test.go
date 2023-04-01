package project

import (
	"encoding/json"
	"io"
	"net/http/httptest"
	"testing"

	"github.com/gofiber/fiber/v2"
	"github.com/larscom/gitlab-ci-dashboard/model"
	"github.com/stretchr/testify/assert"
)

type MockProjectService struct{}

func (s *MockProjectService) GetProjectsGroupedByStatus(groupId int) map[string][]*model.ProjectPipeline {
	if groupId == 1 {
		return map[string][]*model.ProjectPipeline{
			"success": {{Project: &model.Project{Name: "project-1"}, Pipeline: &model.Pipeline{Id: 123}}},
		}
	}

	return make(map[string][]*model.ProjectPipeline)
}

func TestHandleGetProjectsGroupedByStatus(t *testing.T) {
	app := fiber.New()

	app.Get("/:groupId", NewProjectHandler(&MockProjectService{}).HandleGetProjectsGroupedByStatus)

	resp, _ := app.Test(httptest.NewRequest("GET", "/1", nil), -1)
	body, _ := io.ReadAll(resp.Body)

	result := make(map[string][]*model.ProjectPipeline)
	json.Unmarshal(body, &result)

	success := result["success"]

	assert.Equal(t, fiber.StatusOK, resp.StatusCode)
	assert.Len(t, success, 1)
	assert.Equal(t, "project-1", success[0].Project.Name)
	assert.Equal(t, 123, success[0].Pipeline.Id)
}

func TestHandleGetProjectsGroupedByStatusBadRequest(t *testing.T) {
	app := fiber.New()
	app.Get("/:groupId", NewProjectHandler(&MockProjectService{}).HandleGetProjectsGroupedByStatus)

	resp, _ := app.Test(httptest.NewRequest("GET", "/nan", nil), -1)

	assert.Equal(t, fiber.StatusBadRequest, resp.StatusCode)
}
