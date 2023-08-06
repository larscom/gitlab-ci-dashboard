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

func (s *MockProjectService) GetProjectsWithLatestPipeline(groupId int) map[string][]model.ProjectWithLatestPipeline {
	if groupId == 1 {
		return map[string][]model.ProjectWithLatestPipeline{
			"success": {
				{
					Project:        model.Project{Name: "project-1"},
					LatestPipeline: &model.Pipeline{Id: 123},
				},
			},
		}
	}

	return make(map[string][]model.ProjectWithLatestPipeline)
}

func TestHandleGetProjectsWithLatestPipeline(t *testing.T) {
	app := fiber.New()

	app.Get("/projects", NewProjectHandler(&MockProjectService{}).HandleGetProjectsWithLatestPipeline)

	resp, _ := app.Test(httptest.NewRequest("GET", "/projects?groupId=1", nil), -1)
	body, _ := io.ReadAll(resp.Body)

	result := make(map[string][]model.ProjectWithLatestPipeline)
	err := json.Unmarshal(body, &result)
	if err != nil {
		t.Fatal(err.Error())
	}

	success := result["success"]

	assert.Equal(t, fiber.StatusOK, resp.StatusCode)
	assert.Len(t, success, 1)
	assert.Equal(t, "project-1", success[0].Project.Name)
	assert.Equal(t, 123, success[0].LatestPipeline.Id)
}

func TestHandleGetProjectsWithLatestPipelineBadRequest(t *testing.T) {
	app := fiber.New()
	app.Get("/projects", NewProjectHandler(&MockProjectService{}).HandleGetProjectsWithLatestPipeline)

	resp, _ := app.Test(httptest.NewRequest("GET", "/projects", nil), -1)

	assert.Equal(t, fiber.StatusBadRequest, resp.StatusCode)
}
