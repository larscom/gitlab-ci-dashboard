package project

import (
	"github.com/gofiber/fiber/v2"
)

type Handler struct {
	service Service
}

func NewHandler(service Service) *Handler {
	return &Handler{
		service,
	}
}

func (h *Handler) HandleGetProjectsWithLatestPipeline(c *fiber.Ctx) error {
	groupId := c.QueryInt("groupId")

	if groupId == 0 {
		return fiber.NewError(fiber.StatusBadRequest, "groupId is missing or invalid")
	}

	result, err := h.service.GetProjectsWithLatestPipeline(groupId)
	if err != nil {
		return err
	}

	return c.JSON(result)
}

func (h *Handler) HandleGetProjectsWithPipeline(c *fiber.Ctx) error {
	groupId := c.QueryInt("groupId")

	if groupId == 0 {
		return fiber.NewError(fiber.StatusBadRequest, "groupId is missing or invalid")
	}

	result, err := h.service.GetProjectsWithPipeline(groupId)
	if err != nil {
		return err
	}

	return c.JSON(result)
}
