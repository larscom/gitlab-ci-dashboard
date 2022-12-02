package group

import (
	"net/http"

	"github.com/labstack/echo/v4"
)

type GroupController struct {
	groupService *GroupService
}

func NewGroupController(groupService *GroupService) *GroupController {
	return &GroupController{
		groupService: groupService,
	}
}

func (g *GroupController) GetGroups(c echo.Context) error {
	return c.JSON(http.StatusOK, g.groupService.GetGroups())
}
