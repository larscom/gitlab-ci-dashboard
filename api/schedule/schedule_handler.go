package schedule

import (
	"strconv"

	"github.com/gofiber/fiber/v2"
)

type ScheduleHandler struct {
	service ScheduleService
}

func NewScheduleHandler(service ScheduleService) *ScheduleHandler {
	return &ScheduleHandler{service}
}

func (h *ScheduleHandler) HandleGetSchedules(c *fiber.Ctx) error {
	groupId, err := strconv.Atoi(c.Params("groupId"))

	if err != nil {
		return fiber.NewError(fiber.StatusBadRequest, err.Error())
	}

	schedules := h.service.GetSchedules(groupId)
	return c.JSON(schedules)
}
