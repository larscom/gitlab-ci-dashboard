package pipeline

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http/httptest"
	"testing"

	"github.com/gofiber/fiber/v2"
	"github.com/larscom/gitlab-ci-dashboard/model"
	"github.com/larscom/go-cache"
	"github.com/stretchr/testify/assert"
)

func TestHandleGetLatestPipeline(t *testing.T) {
	pipelineLatestLoader := cache.NewCache[model.PipelineKey, *model.Pipeline]()

	const projectId = 1
	const ref = "master"

	pipelineKey := model.NewPipelineKey(projectId, ref)

	pipelineLatestLoader.Put(pipelineKey, &model.Pipeline{Id: 123})

	app := fiber.New()
	app.Get("/:projectId/:ref", NewPipelineHandler(pipelineLatestLoader).HandleGetLatestPipeline)

	resp, _ := app.Test(httptest.NewRequest("GET", fmt.Sprintf("/%d/%s", projectId, ref), nil), -1)
	body, _ := io.ReadAll(resp.Body)

	pipeline := new(model.Pipeline)
	err := json.Unmarshal(body, &pipeline)
	if err != nil {
		t.Fatal(err.Error())
	}

	assert.Equal(t, fiber.StatusOK, resp.StatusCode)
	assert.Equal(t, pipeline.Id, 123)
}

func TestHandleGetLatestPipelineBadRequest(t *testing.T) {
	app := fiber.New()
	app.Get("/:projectId/:ref", NewPipelineHandler(cache.NewCache[model.PipelineKey, *model.Pipeline]()).HandleGetLatestPipeline)

	resp, _ := app.Test(httptest.NewRequest("GET", "/nan/master", nil), -1)

	assert.Equal(t, fiber.StatusBadRequest, resp.StatusCode)
}
