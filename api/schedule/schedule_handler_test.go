package schedule

import (
	"github.com/larscom/gitlab-ci-dashboard/data"
	"io"
	"net/http/httptest"
	"testing"

	"github.com/goccy/go-json"

	"github.com/gofiber/fiber/v2"

	"github.com/stretchr/testify/assert"
)

type MockScheduleService struct{}

func (s *MockScheduleService) GetSchedules(groupId int) []data.ScheduleWithProjectAndPipeline {
	if groupId == 1 {
		return []data.ScheduleWithProjectAndPipeline{
			{
				Schedule: data.Schedule{
					Id: 123,
				},
			},
		}
	}

	return make([]data.ScheduleWithProjectAndPipeline, 0)
}

func TestHandleGetSchedules(t *testing.T) {
	var (
		app     = fiber.New()
		handler = NewScheduleHandler(&MockScheduleService{})
	)

	app.Get("/schedules", handler.HandleGetSchedules)

	resp, _ := app.Test(httptest.NewRequest("GET", "/schedules?groupId=1", nil), -1)
	body, _ := io.ReadAll(resp.Body)

	result := make([]data.ScheduleWithProjectAndPipeline, 0)
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
		handler = NewScheduleHandler(&MockScheduleService{})
	)

	app.Get("/schedules", handler.HandleGetSchedules)

	resp, _ := app.Test(httptest.NewRequest("GET", "/schedules", nil), -1)

	assert.Equal(t, fiber.StatusBadRequest, resp.StatusCode)
}
