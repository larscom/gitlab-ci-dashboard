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
	groups, errDto := g.groupService.GetGroups()
	if errDto != nil {
		return c.JSON(errDto.StatusCode, errDto)
	}

	return c.JSON(http.StatusOK, groups)
}
