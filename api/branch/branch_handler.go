package branch

import (
	"github.com/gofiber/fiber/v2"
)

type BranchHandler struct {
	service BranchService
}

func NewBranchHandler(service BranchService) *BranchHandler {
	return &BranchHandler{
		service,
	}
}

func (h *BranchHandler) HandleGetBranchesWithLatestPipeline(c *fiber.Ctx) error {
	projectId := c.QueryInt("projectId")

	if projectId == 0 {
		return fiber.NewError(fiber.StatusBadRequest, "projectId is missing or invalid")
	}

	return c.JSON(h.service.GetBranchesWithLatestPipeline(projectId))
}
