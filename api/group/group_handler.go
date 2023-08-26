package group

import (
	"github.com/gofiber/fiber/v2"
	"github.com/larscom/gitlab-ci-dashboard/model"
	"github.com/larscom/go-cache"
)

type GroupHandler struct {
	service Service
	cache   cache.Cache[string, []model.Group]
}

func NewGroupHandler(service Service, cache cache.Cache[string, []model.Group]) *GroupHandler {
	return &GroupHandler{
		service,
		cache,
	}
}

func (h *GroupHandler) HandleGetGroups(c *fiber.Ctx) error {
	if groups, ok := h.cache.GetIfPresent(c.OriginalURL()); ok {
		return c.JSON(groups)
	}

	groups := h.service.GetGroups()

	if len(groups) > 0 {
		h.cache.Put(c.OriginalURL(), groups)
	}

	return c.JSON(groups)
}
