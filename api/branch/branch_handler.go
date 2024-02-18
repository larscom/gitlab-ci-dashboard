package branch

import (
	"github.com/gofiber/fiber/v2"
)

type BranchHandler struct {
	service BranchService
}

func NewHandler(service BranchService) *BranchHandler {
	return &BranchHandler{
		service: service,
	}
}

func (h *BranchHandler) HandleGetBranchesWithLatestPipeline(c *fiber.Ctx) error {
	projectId := c.QueryInt("projectId")

	if projectId == 0 {
		return fiber.NewError(fiber.StatusBadRequest, "projectId is missing or invalid")
	}

	result, err := h.service.GetBranchesWithLatestPipeline(projectId, c.Context())
	if err != nil {
		return err
	}

	return c.JSON(result)
}
