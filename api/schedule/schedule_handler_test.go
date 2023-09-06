package schedule

import (
	"github.com/larscom/gitlab-ci-dashboard/model"
	"github.com/larscom/gitlab-ci-dashboard/schedule/mock"
	"io"
	"net/http/httptest"
	"testing"

	"github.com/goccy/go-json"

	"github.com/gofiber/fiber/v2"

	"github.com/stretchr/testify/assert"
)

func TestHandleGetSchedules(t *testing.T) {
	var (
		app     = fiber.New()
		handler = NewHandler(&mock.ScheduleServiceMock{})
	)

	app.Get("/schedules", handler.HandleGetSchedules)

	resp, _ := app.Test(httptest.NewRequest("GET", "/schedules?groupId=1", nil), -1)
	body, _ := io.ReadAll(resp.Body)

	result := make([]model.ScheduleWithProjectAndPipeline, 0)
	err := json.Unmarshal(body, &result)
	if err != nil {
		t.Fatal(err.Error())
	}

	assert.Equal(t, fiber.StatusOK, resp.StatusCode)
	assert.Len(t, result, 1)
	assert.Equal(t, 123, result[0].Schedule.Id)
}

func TestGetSchedulesBadRequest(t *testing.T) {
	var (
		app     = fiber.New()
		handler = NewHandler(&mock.ScheduleServiceMock{})
	)

	app.Get("/schedules", handler.HandleGetSchedules)

	resp, _ := app.Test(httptest.NewRequest("GET", "/schedules", nil), -1)

	assert.Equal(t, fiber.StatusBadRequest, resp.StatusCode)
}

func TestGetSchedulesError(t *testing.T) {
	var (
		err     = fiber.NewError(fiber.StatusInternalServerError, "something bad happened")
		app     = fiber.New()
		handler = NewHandler(&mock.ScheduleServiceMock{
			Error: err,
		})
	)

	app.Get("/schedules", handler.HandleGetSchedules)

	resp, _ := app.Test(httptest.NewRequest("GET", "/schedules?groupId=1", nil), -1)
	defer resp.Body.Close()
	body, _ := io.ReadAll(resp.Body)

	assert.Equal(t, fiber.StatusInternalServerError, resp.StatusCode)
	assert.Equal(t, err.Error(), string(body))
}
