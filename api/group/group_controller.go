package group

import (
	"net/http"

	"github.com/labstack/echo/v4"
)

type GroupController struct {
	GroupService IGroupService
}

func NewGroupController(groupService IGroupService) *GroupController {
	return &GroupController{
		GroupService: groupService,
	}
}

func (g *GroupController) GetGroups(c echo.Context) error {
	return c.JSON(http.StatusOK, g.GroupService.GetGroups())
}
