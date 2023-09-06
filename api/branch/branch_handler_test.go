package branch

import (
	"github.com/larscom/gitlab-ci-dashboard/branch/mock"
	"github.com/larscom/gitlab-ci-dashboard/model"
	"io"
	"net/http/httptest"
	"testing"

	"github.com/goccy/go-json"

	"github.com/gofiber/fiber/v2"

	"github.com/stretchr/testify/assert"
)

func TestHandleGetBranchesWithLatestPipeline(t *testing.T) {
	var (
		app     = fiber.New()
		handler = NewHandler(&mock.BranchServiceMock{})
	)

	app.Get("/branches", handler.HandleGetBranchesWithLatestPipeline)

	resp, _ := app.Test(httptest.NewRequest("GET", "/branches?projectId=1", nil), -1)
	body, _ := io.ReadAll(resp.Body)

	result := make([]model.BranchWithPipeline, 0)
	err := json.Unmarshal(body, &result)
	if err != nil {
		t.Fatal(err.Error())
	}

	assert.Equal(t, fiber.StatusOK, resp.StatusCode)
	assert.Len(t, result, 1)
	assert.Equal(t, result[0].Branch.Name, "branch-1")
}

func TestHandleGetBranchesWithLatestPipelineNoMatch(t *testing.T) {
	var (
		app     = fiber.New()
		handler = NewHandler(&mock.BranchServiceMock{})
	)

	app.Get("/branches", handler.HandleGetBranchesWithLatestPipeline)

	resp, _ := app.Test(httptest.NewRequest("GET", "/branches?projectId=123", nil), -1)
	body, _ := io.ReadAll(resp.Body)

	result := make([]model.BranchWithPipeline, 0)
	err := json.Unmarshal(body, &result)
	if err != nil {
		t.Fatal(err.Error())
	}

	assert.Equal(t, fiber.StatusOK, resp.StatusCode)
	assert.Len(t, result, 0)
}

func TestHandleGetBranchesWithLatestPipelineBadRequest(t *testing.T) {
	var (
		app     = fiber.New()
		handler = NewHandler(&mock.BranchServiceMock{})
	)

	app.Get("/branches", handler.HandleGetBranchesWithLatestPipeline)

	resp, _ := app.Test(httptest.NewRequest("GET", "/branches", nil), -1)

	assert.Equal(t, fiber.StatusBadRequest, resp.StatusCode)
}

func TestHandleGetBranchesWithLatestPipelineError(t *testing.T) {
	var (
		err     = fiber.NewError(fiber.StatusInternalServerError, "something bad happened")
		app     = fiber.New()
		handler = NewHandler(&mock.BranchServiceMock{
			Error: err,
		})
	)

	app.Get("/branches", handler.HandleGetBranchesWithLatestPipeline)

	resp, _ := app.Test(httptest.NewRequest("GET", "/branches?projectId=123", nil), -1)
	defer resp.Body.Close()
	body, _ := io.ReadAll(resp.Body)

	assert.Equal(t, fiber.StatusInternalServerError, resp.StatusCode)
	assert.Equal(t, err.Error(), string(body))
}
