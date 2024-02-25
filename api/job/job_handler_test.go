package job

import (
	"io"
	"net/http/httptest"
	"testing"

	"github.com/goccy/go-json"
	"github.com/gofiber/fiber/v2"
	"github.com/larscom/gitlab-ci-dashboard/job/mock"
	"github.com/larscom/gitlab-ci-dashboard/model"
	"github.com/stretchr/testify/assert"
)

func TestHandleGetJobs(t *testing.T) {
	var (
		app     = fiber.New()
		handler = NewHandler(&mock.JobServiceMock{})
	)

	app.Get("/jobs", handler.HandleGetJobs)

	resp, _ := app.Test(httptest.NewRequest("GET", "/jobs?projectId=1&pipelineId=2&scope=success,failed", nil), -1)
	body, _ := io.ReadAll(resp.Body)

	result := make([]model.Job, 0)
	err := json.Unmarshal(body, &result)
	if err != nil {
		t.Fatal(err.Error())
	}

	assert.Equal(t, fiber.StatusOK, resp.StatusCode)
	assert.Len(t, result, 1)
	assert.Equal(t, "job-1", result[0].Name)
}

func TestHandleGetJobsWithoutScope(t *testing.T) {
	var (
		app     = fiber.New()
		handler = NewHandler(&mock.JobServiceMock{})
	)

	app.Get("/jobs", handler.HandleGetJobs)

	resp, _ := app.Test(httptest.NewRequest("GET", "/jobs?projectId=1&pipelineId=2", nil), -1)
	body, _ := io.ReadAll(resp.Body)

	result := make([]model.Job, 0)
	err := json.Unmarshal(body, &result)
	if err != nil {
		t.Fatal(err.Error())
	}

	assert.Equal(t, fiber.StatusOK, resp.StatusCode)
	assert.Len(t, result, 1)
	assert.Equal(t, "job-2", result[0].Name)
}

func TestHandleGetJobsBadRequestProjectId(t *testing.T) {
	var (
		app     = fiber.New()
		handler = NewHandler(&mock.JobServiceMock{})
	)

	app.Get("/jobs", handler.HandleGetJobs)

	resp, _ := app.Test(httptest.NewRequest("GET", "/jobs?pipelineId=2", nil), -1)
	t.Cleanup(func() {
		if err := resp.Body.Close(); err != nil {
			t.Error(err)
		}
	})

	body, _ := io.ReadAll(resp.Body)

	assert.Equal(t, fiber.StatusBadRequest, resp.StatusCode)
	assert.Equal(t, "projectId is missing or invalid", string(body))
}

func TestHandleGetJobsBadRequestPipelineId(t *testing.T) {
	var (
		app     = fiber.New()
		handler = NewHandler(&mock.JobServiceMock{})
	)

	app.Get("/jobs", handler.HandleGetJobs)

	resp, _ := app.Test(httptest.NewRequest("GET", "/jobs?projectId=1", nil), -1)
	t.Cleanup(func() {
		if err := resp.Body.Close(); err != nil {
			t.Error(err)
		}
	})

	body, _ := io.ReadAll(resp.Body)

	assert.Equal(t, fiber.StatusBadRequest, resp.StatusCode)
	assert.Equal(t, "pipelineId is missing or invalid", string(body))
}

func TestHandleGetJobsError(t *testing.T) {
	var (
		err     = fiber.NewError(fiber.StatusInternalServerError, "something bad happened")
		app     = fiber.New()
		handler = NewHandler(&mock.JobServiceMock{
			Error: err,
		})
	)

	app.Get("/jobs", handler.HandleGetJobs)

	resp, _ := app.Test(httptest.NewRequest("GET", "/jobs?projectId=1&pipelineId=2", nil), -1)
	body, _ := io.ReadAll(resp.Body)

	t.Cleanup(func() {
		if err := resp.Body.Close(); err != nil {
			t.Error(err)
		}
	})

	assert.Equal(t, fiber.StatusInternalServerError, resp.StatusCode)
	assert.Equal(t, err.Error(), string(body))
}
