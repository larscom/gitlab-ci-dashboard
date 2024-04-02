package group

import (
	"github.com/gofiber/fiber/v2"
	"github.com/larscom/gitlab-ci-dashboard/model"
	"github.com/larscom/go-cache"
)

type GroupHandler struct {
	service GroupService
	cache   cache.Cache[string, []model.Group]
}

func NewHandler(service GroupService, cache cache.Cache[string, []model.Group]) *GroupHandler {
	return &GroupHandler{
		service: service,
		cache:   cache,
	}
}

func (h *GroupHandler) HandleGetGroups(c *fiber.Ctx) error {
	if groups, ok := h.cache.Get(c.OriginalURL()); ok {
		return c.JSON(groups)
	}

	groups, err := h.service.GetGroups(c.Context())
	if err != nil {
		return err
	}

	if len(groups) > 0 {
		h.cache.Put(c.OriginalURL(), groups)
	}

	return c.JSON(groups)
}
