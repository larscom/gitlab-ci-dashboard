package project

import (
	"strconv"

	"github.com/gofiber/fiber/v2"
)

type ProjectHandler struct {
	service ProjectService
}

func NewProjectHandler(service ProjectService) *ProjectHandler {
	return &ProjectHandler{service}
}

func (h *ProjectHandler) HandleGetProjectsGroupedByStatus(c *fiber.Ctx) error {
	groupId, err := strconv.Atoi(c.Params("groupId"))

	if err != nil {
		return fiber.NewError(fiber.StatusBadRequest, err.Error())
	}

	return c.JSON(h.service.GetProjectsGroupedByStatus(groupId))
}
