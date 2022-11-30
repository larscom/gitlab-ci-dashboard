package pipeline

import (
	"fmt"
	"net/http"
	"strconv"

	"github.com/labstack/echo/v4"
	"github.com/larscom/gitlab-ci-dashboard/model"
)

type PipelineController struct {
	pipelineService *PipelineService
}

func NewPipelineController(pipelineService *PipelineService) *PipelineController {
	return &PipelineController{
		pipelineService: pipelineService,
	}
}

func (p *PipelineController) GetPipelines(c echo.Context) error {
	id := c.Param("projectId")
	projectId, err := strconv.Atoi(id)
	if err != nil {
		errDto := model.NewError(http.StatusBadRequest, fmt.Sprintf("'%s' could not be parsed into integer", id))
		return c.JSON(errDto.StatusCode, errDto)
	}

	pipelines, errDto := p.pipelineService.GetPipelines(projectId, c.Param("ref"))
	if errDto != nil {
		return c.JSON(errDto.StatusCode, errDto)
	}

	return c.JSON(http.StatusOK, pipelines)
}
