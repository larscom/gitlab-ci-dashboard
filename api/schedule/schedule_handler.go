package schedule

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

func (h *Handler) HandleGetSchedules(c *fiber.Ctx) error {
	groupId := c.QueryInt("groupId")

	if groupId == 0 {
		return fiber.NewError(fiber.StatusBadRequest, "groupId is missing or invalid")
	}

	return c.JSON(h.service.GetSchedules(groupId))
}
