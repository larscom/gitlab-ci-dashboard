package pipeline

import (
	"net/http"
	"net/http/httptest"
	"regexp"
	"testing"

	"github.com/labstack/echo/v4"
	"github.com/stretchr/testify/assert"
	"github.com/xanzy/go-gitlab"
)

type PipelineServiceMock struct{}

func (p *PipelineServiceMock) GetPipelines(projectId int, ref string) []*gitlab.PipelineInfo {
	return []*gitlab.PipelineInfo{{ProjectID: projectId, Ref: ref}}
}

func TestGetPipelines(t *testing.T) {
	req := httptest.NewRequest(http.MethodGet, "/", nil)
	rec := httptest.NewRecorder()

	e := echo.New()
	c := e.NewContext(req, rec)

	c.SetPath("/:projectId/pipelines/:ref")
	c.SetParamNames("projectId", "ref")
	c.SetParamValues("1", "master")

	controller := NewPipelineController(&PipelineServiceMock{})

	if assert.NoError(t, controller.GetPipelines(c)) {
		assert.Equal(t, http.StatusOK, rec.Code)

		r := regexp.MustCompile("\\s")

		expected := `[{"id":0,"project_id":1,"status":"","source":"","ref":"master","sha":"","web_url":"","updated_at":null,"created_at":null}]`
		assert.Equal(t, r.ReplaceAllString(string(expected), ""), r.ReplaceAllString(rec.Body.String(), ""))
	}
}
