package pipeline

import (
	"strconv"

	"github.com/gofiber/fiber/v2"
	"github.com/larscom/gitlab-ci-dashboard/model"
	"github.com/larscom/go-cache"
)

type PipelineHandler struct {
	pipelineLatestLoader cache.Cache[model.PipelineKey, *model.Pipeline]
}

func NewPipelineHandler(pipelineLatestLoader cache.Cache[model.PipelineKey, *model.Pipeline]) *PipelineHandler {
	return &PipelineHandler{pipelineLatestLoader}
}

func (h *PipelineHandler) HandleGetLatestPipeline(c *fiber.Ctx) error {
	projectId, err := strconv.Atoi(c.Params("projectId"))
	if err != nil {
		return fiber.NewError(fiber.StatusBadRequest, err.Error())
	}

	pipeline, _ := h.pipelineLatestLoader.Get(model.NewPipelineKey(projectId, c.Params("ref")))

	return c.JSON(pipeline)
}
