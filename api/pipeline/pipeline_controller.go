package pipeline

import (
	"net/http"
	"strconv"

	"github.com/labstack/echo/v4"
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
	projectId, _ := strconv.Atoi(c.Param("projectId"))
	return c.JSON(http.StatusOK, p.pipelineService.GetPipelines(projectId, c.Param("ref")))
}
