package schedule

import (
	"github.com/gofiber/fiber/v2"
)

type ScheduleHandler struct {
	service ScheduleService
}

func NewHandler(service ScheduleService) *ScheduleHandler {
	return &ScheduleHandler{
		service: service,
	}
}

func (h *ScheduleHandler) HandleGetSchedules(c *fiber.Ctx) error {
	groupId := c.QueryInt("groupId")

	if groupId == 0 {
		return fiber.NewError(fiber.StatusBadRequest, "groupId is missing or invalid")
	}

	result, err := h.service.GetSchedules(groupId)
	if err != nil {
		return err
	}

	return c.JSON(result)
}
