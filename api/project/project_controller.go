package project

import (
	"net/http"
	"strconv"

	"github.com/labstack/echo/v4"
)

type ProjectController struct {
	ProjectService *ProjectService
}

func NewProjectController(projectService *ProjectService) *ProjectController {
	return &ProjectController{
		ProjectService: projectService,
	}
}

func (p *ProjectController) GetProjectsGroupedByStatus(c echo.Context) error {
	groupId, _ := strconv.Atoi(c.Param("groupId"))
	return c.JSON(http.StatusOK, p.ProjectService.GetProjectsGroupedByStatus(groupId))
}
