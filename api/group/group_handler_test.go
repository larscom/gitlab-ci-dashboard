package group

import (
	"encoding/json"
	"io"
	"net/http/httptest"
	"testing"

	"github.com/gofiber/fiber/v2"
	"github.com/larscom/gitlab-ci-dashboard/model"
	"github.com/larscom/go-cache"
	"github.com/stretchr/testify/assert"
)

type MockGroupService struct {
	empty bool
}

func (s *MockGroupService) GetGroups() []model.Group {
	if s.empty {
		return make([]model.Group, 0)
	}
	return []model.Group{{Name: "group-1"}}
}

func TestHandleGetGroupsFromServiceSaveInCache(t *testing.T) {
	app := fiber.New()

	groupCache := cache.New[string, []model.Group]()
	assert.Zero(t, groupCache.Count())

	app.Get("/", NewGroupHandler(&MockGroupService{}, groupCache).HandleGetGroups)

	resp, _ := app.Test(httptest.NewRequest("GET", "/", nil), -1)
	body, _ := io.ReadAll(resp.Body)

	result := make([]model.Group, 0)
	err := json.Unmarshal(body, &result)
	if err != nil {
		t.Fatal(err.Error())
	}

	assert.Equal(t, fiber.StatusOK, resp.StatusCode)
	assert.Len(t, result, 1)
	assert.Equal(t, result[0].Name, "group-1")

	cachedValue, found := groupCache.GetIfPresent("/")
	assert.True(t, found)
	assert.Equal(t, cachedValue[0].Name, "group-1")
}

func TestHandleGetGroupsFromCache(t *testing.T) {
	app := fiber.New()

	groupCache := cache.New[string, []model.Group]()
	groupCache.Put("/", []model.Group{{Name: "group-2"}})

	app.Get("/", NewGroupHandler(&MockGroupService{}, groupCache).HandleGetGroups)

	resp, _ := app.Test(httptest.NewRequest("GET", "/", nil), -1)
	body, _ := io.ReadAll(resp.Body)

	result := make([]model.Group, 0)
	err := json.Unmarshal(body, &result)
	if err != nil {
		t.Fatal(err.Error())
	}

	assert.Equal(t, fiber.StatusOK, resp.StatusCode)
	assert.Len(t, result, 1)
	assert.Equal(t, result[0].Name, "group-2")
}

func TestHandleGetGroupsSaveCacheOnlyIfNotEmpty(t *testing.T) {
	app := fiber.New()

	groupCache := cache.New[string, []model.Group]()

	app.Get("/", NewGroupHandler(&MockGroupService{empty: true}, groupCache).HandleGetGroups)

	resp, _ := app.Test(httptest.NewRequest("GET", "/", nil), -1)
	body, _ := io.ReadAll(resp.Body)

	result := make([]model.Group, 0)
	err := json.Unmarshal(body, &result)
	if err != nil {
		t.Fatal(err.Error())
	}

	assert.Equal(t, fiber.StatusOK, resp.StatusCode)
	assert.Empty(t, result)

	_, found := groupCache.GetIfPresent("/")
	assert.False(t, found)
}
