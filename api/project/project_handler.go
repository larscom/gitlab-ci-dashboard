package project

import (
	"github.com/gofiber/fiber/v2"
)

type ProjectHandler struct {
	service ProjectService
}

func NewProjectHandler(service ProjectService) *ProjectHandler {
	return &ProjectHandler{
		service,
	}
}

func (h *ProjectHandler) HandleGetProjectsWithLatestPipeline(c *fiber.Ctx) error {
	groupId := c.QueryInt("groupId")

	if groupId == 0 {
		return fiber.NewError(fiber.StatusBadRequest, "groupId is missing or invalid")
	}

	return c.JSON(h.service.GetProjectsWithLatestPipeline(groupId))
}
