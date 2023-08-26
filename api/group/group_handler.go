package group

import (
	"github.com/gofiber/fiber/v2"
	"github.com/larscom/gitlab-ci-dashboard/model"

	"github.com/larscom/go-cache"
)

type Handler struct {
	service Service
	cache   cache.Cache[string, []model.Group]
}

func NewHandler(service Service, cache cache.Cache[string, []model.Group]) *Handler {
	return &Handler{
		service,
		cache,
	}
}

func (h *Handler) HandleGetGroups(c *fiber.Ctx) error {
	if groups, ok := h.cache.GetIfPresent(c.OriginalURL()); ok {
		return c.JSON(groups)
	}

	groups := h.service.GetGroups()

	if len(groups) > 0 {
		h.cache.Put(c.OriginalURL(), groups)
	}

	return c.JSON(groups)
}
