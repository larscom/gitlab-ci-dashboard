package group

import (
	"encoding/json"
	"github.com/larscom/gitlab-ci-dashboard/group/mock"
	"github.com/larscom/gitlab-ci-dashboard/model"
	"io"
	"net/http/httptest"
	"testing"

	"github.com/gofiber/fiber/v2"

	"github.com/larscom/go-cache"
	"github.com/stretchr/testify/assert"
)

func TestHandleGetGroupsFromServiceSaveInCache(t *testing.T) {
	var (
		app        = fiber.New()
		groupCache = cache.New[string, []model.Group]()
		handler    = NewHandler(&mock.GroupServiceMock{}, groupCache)
	)

	assert.Zero(t, groupCache.Count())

	app.Get("/groups", handler.HandleGetGroups)

	resp, _ := app.Test(httptest.NewRequest("GET", "/groups", nil), -1)
	body, _ := io.ReadAll(resp.Body)

	result := make([]model.Group, 0)
	err := json.Unmarshal(body, &result)
	if err != nil {
		t.Fatal(err.Error())
	}

	assert.Equal(t, fiber.StatusOK, resp.StatusCode)
	assert.Len(t, result, 1)
	assert.Equal(t, result[0].Name, "group-1")

	cachedValue, found := groupCache.GetIfPresent("/groups")
	assert.True(t, found)
	assert.Equal(t, cachedValue[0].Name, "group-1")
}

func TestHandleGetGroupsFromCache(t *testing.T) {
	var (
		app        = fiber.New()
		groupCache = cache.New[string, []model.Group]()
		handler    = NewHandler(&mock.GroupServiceMock{}, groupCache)
	)

	groupCache.Put("/groups", []model.Group{{Name: "group-2"}})

	app.Get("/groups", handler.HandleGetGroups)

	resp, _ := app.Test(httptest.NewRequest("GET", "/groups", nil), -1)
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
	var (
		app        = fiber.New()
		groupCache = cache.New[string, []model.Group]()
		handler    = NewHandler(&mock.GroupServiceMock{Empty: true}, groupCache)
	)

	app.Get("/groups", handler.HandleGetGroups)

	resp, _ := app.Test(httptest.NewRequest("GET", "/groups", nil), -1)
	body, _ := io.ReadAll(resp.Body)

	result := make([]model.Group, 0)
	err := json.Unmarshal(body, &result)
	if err != nil {
		t.Fatal(err.Error())
	}

	assert.Equal(t, fiber.StatusOK, resp.StatusCode)
	assert.Empty(t, result)

	_, found := groupCache.GetIfPresent("/groups")
	assert.False(t, found)
}

func TestHandleGetGroupsError(t *testing.T) {
	var (
		err     = fiber.NewError(fiber.StatusInternalServerError, "something bad happened")
		app     = fiber.New()
		handler = NewHandler(&mock.GroupServiceMock{
			Error: err,
		}, cache.New[string, []model.Group]())
	)

	app.Get("/groups", handler.HandleGetGroups)

	resp, _ := app.Test(httptest.NewRequest("GET", "/groups", nil), -1)
	defer resp.Body.Close()
	body, _ := io.ReadAll(resp.Body)

	assert.Equal(t, fiber.StatusInternalServerError, resp.StatusCode)
	assert.Equal(t, err.Error(), string(body))
}
