package schedule

import (
	"github.com/larscom/gitlab-ci-dashboard/model"
	"io"
	"net/http/httptest"
	"testing"

	"github.com/goccy/go-json"

	"github.com/gofiber/fiber/v2"

	"github.com/stretchr/testify/assert"
)

type MockScheduleService struct{}

func (s *MockScheduleService) GetSchedules(groupId int) ([]model.ScheduleWithProjectAndPipeline, error) {
	if groupId == 1 {
		return []model.ScheduleWithProjectAndPipeline{
			{
				Schedule: model.Schedule{
					Id: 123,
				},
			},
		}, nil
	}

	return make([]model.ScheduleWithProjectAndPipeline, 0), nil
}

func TestHandleGetSchedules(t *testing.T) {
	var (
		app     = fiber.New()
		handler = NewHandler(&MockScheduleService{})
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
		handler = NewHandler(&MockScheduleService{})
	)

	app.Get("/schedules", handler.HandleGetSchedules)

	resp, _ := app.Test(httptest.NewRequest("GET", "/schedules", nil), -1)

	assert.Equal(t, fiber.StatusBadRequest, resp.StatusCode)
}
