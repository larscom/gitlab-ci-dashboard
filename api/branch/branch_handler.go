package branch

import (
	"github.com/gofiber/fiber/v2"
	"github.com/larscom/gitlab-ci-dashboard/model"
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

	result, err := h.service.GetBranchesWithLatestPipeline(model.ProjectId(projectId))
	if err != nil {
		return err
	}

	return c.JSON(result)
}
