package project

import (
	"encoding/json"
	"github.com/larscom/gitlab-ci-dashboard/data"
	"io"
	"net/http/httptest"
	"testing"

	"github.com/gofiber/fiber/v2"

	"github.com/stretchr/testify/assert"
)

type MockProjectService struct{}

func (s *MockProjectService) GetProjectsWithLatestPipeline(groupId int) map[string][]data.ProjectWithPipeline {
	if groupId == 1 {
		return map[string][]data.ProjectWithPipeline{
			"success": {
				{
					Project:  data.Project{Name: "project-1"},
					Pipeline: &data.Pipeline{Id: 111},
				},
			},
		}
	}

	return make(map[string][]data.ProjectWithPipeline)
}

func (s *MockProjectService) GetProjectsWithPipeline(groupId int) []data.ProjectWithPipeline {
	if groupId == 1 {
		return []data.ProjectWithPipeline{
			{
				Project:  data.Project{Name: "project-2"},
				Pipeline: &data.Pipeline{Id: 222},
			},
		}
	}
	return make([]data.ProjectWithPipeline, 0)
}

func TestHandleGetProjectsWithLatestPipeline(t *testing.T) {
	var (
		app     = fiber.New()
		handler = NewProjectHandler(&MockProjectService{})
	)

	app.Get("/projects", handler.HandleGetProjectsWithLatestPipeline)

	resp, _ := app.Test(httptest.NewRequest("GET", "/projects?groupId=1", nil), -1)
	body, _ := io.ReadAll(resp.Body)

	result := make(map[string][]data.ProjectWithPipeline)
	err := json.Unmarshal(body, &result)
	if err != nil {
		t.Fatal(err.Error())
	}

	success := result["success"]

	assert.Equal(t, fiber.StatusOK, resp.StatusCode)
	assert.Len(t, success, 1)
	assert.Equal(t, "project-1", success[0].Project.Name)
	assert.Equal(t, 111, success[0].Pipeline.Id)
}

func TestHandleGetProjectsWithLatestPipelineBadRequest(t *testing.T) {
	var (
		app     = fiber.New()
		handler = NewProjectHandler(&MockProjectService{})
	)

	app.Get("/projects", handler.HandleGetProjectsWithLatestPipeline)

	resp, _ := app.Test(httptest.NewRequest("GET", "/projects", nil), -1)

	assert.Equal(t, fiber.StatusBadRequest, resp.StatusCode)
}

func TestHandleGetProjectsWithPipeline(t *testing.T) {
	var (
		app     = fiber.New()
		handler = NewProjectHandler(&MockProjectService{})
	)

	app.Get("/projects", handler.HandleGetProjectsWithPipeline)

	resp, _ := app.Test(httptest.NewRequest("GET", "/projects?groupId=1", nil), -1)
	body, _ := io.ReadAll(resp.Body)

	result := make([]data.ProjectWithPipeline, 0)
	err := json.Unmarshal(body, &result)
	if err != nil {
		t.Fatal(err.Error())
	}

	assert.Equal(t, fiber.StatusOK, resp.StatusCode)
	assert.Len(t, result, 1)
	assert.Equal(t, "project-2", result[0].Project.Name)
	assert.Equal(t, 222, result[0].Pipeline.Id)
}

func TestHandleGetProjectsWithPipelineBadRequest(t *testing.T) {
	var (
		app     = fiber.New()
		handler = NewProjectHandler(&MockProjectService{})
	)

	app.Get("/projects", handler.HandleGetProjectsWithPipeline)

	resp, _ := app.Test(httptest.NewRequest("GET", "/projects", nil), -1)

	assert.Equal(t, fiber.StatusBadRequest, resp.StatusCode)
}
