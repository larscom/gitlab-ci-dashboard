package schedule

import (
	"github.com/gofiber/fiber/v2"
)

type ScheduleHandler struct {
	service Service
}

func NewScheduleHandler(service Service) *ScheduleHandler {
	return &ScheduleHandler{
		service,
	}
}

func (h *ScheduleHandler) HandleGetSchedules(c *fiber.Ctx) error {
	groupId := c.QueryInt("groupId")

	if groupId == 0 {
		return fiber.NewError(fiber.StatusBadRequest, "groupId is missing or invalid")
	}

	return c.JSON(h.service.GetSchedules(groupId))
}
