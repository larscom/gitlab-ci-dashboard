package project

import (
	"fmt"
	"net/http"
	"strconv"

	"github.com/labstack/echo/v4"
	"github.com/larscom/gitlab-ci-dashboard/model"
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
	id := c.Param("groupId")
	groupId, err := strconv.Atoi(id)
	if err != nil {
		errDto := model.NewError(http.StatusBadRequest, fmt.Sprintf("'%s' could not be parsed into integer", id))
		return c.JSON(errDto.StatusCode, errDto)
	}

	projects, errDto := p.projectService.GetProjectsWithPipelines(groupId)
	if errDto != nil {
		return c.JSON(errDto.StatusCode, errDto)
	}

	return c.JSON(http.StatusOK, projects)
}
