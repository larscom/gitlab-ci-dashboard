package branch

import (
	"strconv"

	"github.com/gofiber/fiber/v2"
)

type BranchHandler struct {
	service BranchService
}

func NewBranchHandler(service BranchService) *BranchHandler {
	return &BranchHandler{service}
}

func (h *BranchHandler) HandleGetBranchesWithLatestPipeline(c *fiber.Ctx) error {
	projectId, err := strconv.Atoi(c.Params("projectId"))

	if err != nil {
		return fiber.NewError(fiber.StatusBadRequest, err.Error())
	}

	return c.JSON(h.service.GetBranchesWithLatestPipeline(projectId))
}
