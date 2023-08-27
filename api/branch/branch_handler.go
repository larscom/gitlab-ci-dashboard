package branch

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

func (h *Handler) HandleGetBranchesWithLatestPipeline(c *fiber.Ctx) error {
	projectId := c.QueryInt("projectId")

	if projectId == 0 {
		return fiber.NewError(fiber.StatusBadRequest, "projectId is missing or invalid")
	}

	result, err := h.service.GetBranchesWithLatestPipeline(projectId)
	if err != nil {
		return err
	}

	return c.JSON(result)
}
