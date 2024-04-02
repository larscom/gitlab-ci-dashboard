package group

import (
	"encoding/json"
	"io"
	"net/http/httptest"
	"testing"

	"github.com/larscom/gitlab-ci-dashboard/group/mock"
	"github.com/larscom/gitlab-ci-dashboard/model"
	"github.com/larscom/go-cache"

	"github.com/gofiber/fiber/v2"

	"github.com/stretchr/testify/assert"
)

func TestHandleGetGroupsFromServiceSaveInCache(t *testing.T) {
	var (
		app        = fiber.New()
		groupCache = cache.NewCache[string, []model.Group]()
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

	cachedValue, found := groupCache.Get("/groups")
	assert.True(t, found)
	assert.Equal(t, cachedValue[0].Name, "group-1")
}

func TestHandleGetGroupsFromCache(t *testing.T) {
	var (
		app        = fiber.New()
		groupCache = cache.NewCache[string, []model.Group]()
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
		groupCache = cache.NewCache[string, []model.Group]()
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

	_, found := groupCache.Get("/groups")
	assert.False(t, found)
}

func TestHandleGetGroupsError(t *testing.T) {
	var (
		err     = fiber.NewError(fiber.StatusInternalServerError, "something bad happened")
		app     = fiber.New()
		handler = NewHandler(&mock.GroupServiceMock{
			Error: err,
		}, cache.NewCache[string, []model.Group]())
	)

	app.Get("/groups", handler.HandleGetGroups)

	resp, _ := app.Test(httptest.NewRequest("GET", "/groups", nil), -1)
	body, _ := io.ReadAll(resp.Body)

	t.Cleanup(func() {
		if err := resp.Body.Close(); err != nil {
			t.Error(err)
		}
	})

	assert.Equal(t, fiber.StatusInternalServerError, resp.StatusCode)
	assert.Equal(t, err.Error(), string(body))
}
