package project

import (
	"encoding/json"
	"io"
	"net/http/httptest"
	"testing"

	"github.com/larscom/gitlab-ci-dashboard/model"
	"github.com/larscom/gitlab-ci-dashboard/project/mock"

	"github.com/gofiber/fiber/v2"

	"github.com/stretchr/testify/assert"
)

func TestHandleGetProjectsWithLatestPipeline(t *testing.T) {
	var (
		app     = fiber.New()
		handler = NewHandler(&mock.ProjectServiceMock{})
	)

	app.Get("/projects", handler.HandleGetProjectsWithLatestPipeline)

	resp, _ := app.Test(httptest.NewRequest("GET", "/projects?groupId=1", nil), -1)
	body, _ := io.ReadAll(resp.Body)

	result := make([]model.ProjectLatestPipeline, 0)
	err := json.Unmarshal(body, &result)
	if err != nil {
		t.Fatal(err.Error())
	}

	assert.Equal(t, fiber.StatusOK, resp.StatusCode)
	assert.Len(t, result, 1)
	assert.Equal(t, "project-1", result[0].Project.Name)
	assert.Equal(t, 111, result[0].Pipeline.Id)
}

func TestHandleGetProjectsWithLatestPipelineBadRequest(t *testing.T) {
	var (
		app     = fiber.New()
		handler = NewHandler(&mock.ProjectServiceMock{})
	)

	app.Get("/projects", handler.HandleGetProjectsWithLatestPipeline)

	resp, _ := app.Test(httptest.NewRequest("GET", "/projects", nil), -1)

	assert.Equal(t, fiber.StatusBadRequest, resp.StatusCode)
}

func TestHandleGetProjectsWithLatestPipelineError(t *testing.T) {
	var (
		err     = fiber.NewError(fiber.StatusInternalServerError, "something bad happened")
		app     = fiber.New()
		handler = NewHandler(&mock.ProjectServiceMock{
			Error: err,
		})
	)

	app.Get("/projects", handler.HandleGetProjectsWithLatestPipeline)

	resp, _ := app.Test(httptest.NewRequest("GET", "/projects?groupId=1", nil), -1)
	body, _ := io.ReadAll(resp.Body)

	t.Cleanup(func() {
		if err := resp.Body.Close(); err != nil {
			t.Error(err)
		}
	})

	assert.Equal(t, fiber.StatusInternalServerError, resp.StatusCode)
	assert.Equal(t, err.Error(), string(body))
}

func TestHandleGetProjectsWithPipeline(t *testing.T) {
	var (
		app     = fiber.New()
		handler = NewHandler(&mock.ProjectServiceMock{})
	)

	app.Get("/projects", handler.HandleGetProjectsWithPipeline)

	resp, _ := app.Test(httptest.NewRequest("GET", "/projects?groupId=1", nil), -1)
	body, _ := io.ReadAll(resp.Body)

	result := make([]model.ProjectPipelines, 0)
	err := json.Unmarshal(body, &result)
	if err != nil {
		t.Fatal(err.Error())
	}

	assert.Equal(t, fiber.StatusOK, resp.StatusCode)
	assert.Len(t, result, 1)
	assert.Equal(t, "project-2", result[0].Project.Name)
	assert.Equal(t, 222, result[0].Pipelines[0].Id)
}

func TestHandleGetProjectsWithPipelineBadRequest(t *testing.T) {
	var (
		app     = fiber.New()
		handler = NewHandler(&mock.ProjectServiceMock{})
	)

	app.Get("/projects", handler.HandleGetProjectsWithPipeline)

	resp, _ := app.Test(httptest.NewRequest("GET", "/projects", nil), -1)

	assert.Equal(t, fiber.StatusBadRequest, resp.StatusCode)
}

func TestHandleGetProjectsWithPipelineError(t *testing.T) {
	var (
		err     = fiber.NewError(fiber.StatusInternalServerError, "something bad happened")
		app     = fiber.New()
		handler = NewHandler(&mock.ProjectServiceMock{
			Error: err,
		})
	)

	app.Get("/projects", handler.HandleGetProjectsWithPipeline)

	resp, _ := app.Test(httptest.NewRequest("GET", "/projects?groupId=1", nil), -1)
	body, _ := io.ReadAll(resp.Body)

	t.Cleanup(func() {
		if err := resp.Body.Close(); err != nil {
			t.Error(err)
		}
	})

	assert.Equal(t, fiber.StatusInternalServerError, resp.StatusCode)
	assert.Equal(t, err.Error(), string(body))
}
