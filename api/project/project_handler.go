package project

import (
	"github.com/gofiber/fiber/v2"
)

type ProjectHandler struct {
	service ProjectService
}

func NewHandler(service ProjectService) *ProjectHandler {
	return &ProjectHandler{
		service: service,
	}
}

func (h *ProjectHandler) HandleGetProjectsWithLatestPipeline(c *fiber.Ctx) error {
	groupId := c.QueryInt("groupId")

	if groupId == 0 {
		return fiber.NewError(fiber.StatusBadRequest, "groupId is missing or invalid")
	}

	result, err := h.service.GetProjectsWithLatestPipeline(groupId, c.Context())
	if err != nil {
		return err
	}

	return c.JSON(result)
}

func (h *ProjectHandler) HandleGetProjectsWithPipeline(c *fiber.Ctx) error {
	groupId := c.QueryInt("groupId")

	if groupId == 0 {
		return fiber.NewError(fiber.StatusBadRequest, "groupId is missing or invalid")
	}

	result, err := h.service.GetProjectsWithPipeline(groupId, c.Context())
	if err != nil {
		return err
	}

	return c.JSON(result)
}
