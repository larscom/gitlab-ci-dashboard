package project

import (
	"net/http"
	"strconv"

	"github.com/labstack/echo/v4"
)

type ProjectController struct {
	projectService *ProjectService
}

func NewProjectController(projectService *ProjectService) *ProjectController {
	return &ProjectController{
		projectService: projectService,
	}
}

func (p *ProjectController) GetProjectsWithPipelines(c echo.Context) error {
	groupId, _ := strconv.Atoi(c.Param("groupId"))
	return c.JSON(http.StatusOK, p.projectService.GetProjectsWithPipelines(groupId))
}
