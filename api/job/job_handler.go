package job

import (
	"strings"

	"github.com/gofiber/fiber/v2"
)

type JobHandler struct {
	service JobService
}

func NewHandler(service JobService) *JobHandler {
	return &JobHandler{
		service: service,
	}
}

func (h *JobHandler) HandleGetJobs(c *fiber.Ctx) error {
	projectId := c.QueryInt("projectId")
	if projectId == 0 {
		return fiber.NewError(fiber.StatusBadRequest, "projectId is missing or invalid")
	}
	pipelineId := c.QueryInt("pipelineId")
	if pipelineId == 0 {
		return fiber.NewError(fiber.StatusBadRequest, "pipelineId is missing or invalid")
	}

	scope := make([]string, 0)
	if c.Query("scope") != "" {
		scope = strings.Split(c.Query("scope"), ",")
	}

	result, err := h.service.GetJobs(projectId, pipelineId, scope)
	if err != nil {
		return err
	}

	return c.JSON(result)
}
