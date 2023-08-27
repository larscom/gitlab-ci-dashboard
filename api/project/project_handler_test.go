package project

import (
	"encoding/json"
	"github.com/larscom/gitlab-ci-dashboard/model"
	"io"
	"net/http/httptest"
	"testing"

	"github.com/gofiber/fiber/v2"

	"github.com/stretchr/testify/assert"
)

type MockProjectService struct{}

func (s *MockProjectService) GetProjectsWithLatestPipeline(groupId int) (map[string][]model.ProjectWithPipeline, error) {
	if groupId == 1 {
		return map[string][]model.ProjectWithPipeline{
			"success": {
				{
					Project:  model.Project{Name: "project-1"},
					Pipeline: &model.Pipeline{Id: 111},
				},
			},
		}, nil
	}

	return make(map[string][]model.ProjectWithPipeline), nil
}

func (s *MockProjectService) GetProjectsWithPipeline(groupId int) ([]model.ProjectWithPipeline, error) {
	if groupId == 1 {
		return []model.ProjectWithPipeline{
			{
				Project:  model.Project{Name: "project-2"},
				Pipeline: &model.Pipeline{Id: 222},
			},
		}, nil
	}
	return make([]model.ProjectWithPipeline, 0), nil
}

func TestHandleGetProjectsWithLatestPipeline(t *testing.T) {
	var (
		app     = fiber.New()
		handler = NewHandler(&MockProjectService{})
	)

	app.Get("/projects", handler.HandleGetProjectsWithLatestPipeline)

	resp, _ := app.Test(httptest.NewRequest("GET", "/projects?groupId=1", nil), -1)
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
	assert.Equal(t, 111, success[0].Pipeline.Id)
}

func TestHandleGetProjectsWithLatestPipelineBadRequest(t *testing.T) {
	var (
		app     = fiber.New()
		handler = NewHandler(&MockProjectService{})
	)

	app.Get("/projects", handler.HandleGetProjectsWithLatestPipeline)

	resp, _ := app.Test(httptest.NewRequest("GET", "/projects", nil), -1)

	assert.Equal(t, fiber.StatusBadRequest, resp.StatusCode)
}

func TestHandleGetProjectsWithPipeline(t *testing.T) {
	var (
		app     = fiber.New()
		handler = NewHandler(&MockProjectService{})
	)

	app.Get("/projects", handler.HandleGetProjectsWithPipeline)

	resp, _ := app.Test(httptest.NewRequest("GET", "/projects?groupId=1", nil), -1)
	body, _ := io.ReadAll(resp.Body)

	result := make([]model.ProjectWithPipeline, 0)
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
		handler = NewHandler(&MockProjectService{})
	)

	app.Get("/projects", handler.HandleGetProjectsWithPipeline)

	resp, _ := app.Test(httptest.NewRequest("GET", "/projects", nil), -1)

	assert.Equal(t, fiber.StatusBadRequest, resp.StatusCode)
}
