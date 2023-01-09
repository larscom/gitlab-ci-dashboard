package pipeline

import (
	"net/http"
	"strconv"

	"github.com/labstack/echo/v4"
)

type PipelineController struct {
	PipelineService IPipelineService
}

func NewPipelineController(pipelineService IPipelineService) *PipelineController {
	return &PipelineController{
		PipelineService: pipelineService,
	}
}

func (p *PipelineController) GetPipelines(c echo.Context) error {
	projectId, _ := strconv.Atoi(c.Param("projectId"))
	return c.JSON(http.StatusOK, p.PipelineService.GetPipelines(projectId, c.Param("ref")))
}
