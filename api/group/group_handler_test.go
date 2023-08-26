package group

import (
	"encoding/json"
	"io"
	"net/http/httptest"
	"testing"

	"github.com/gofiber/fiber/v2"

	"github.com/larscom/go-cache"
	"github.com/stretchr/testify/assert"
)

type MockGroupService struct {
	empty bool
}

func (s *MockGroupService) GetGroups() []Group {
	if s.empty {
		return make([]Group, 0)
	}
	return []Group{{Name: "group-1"}}
}

func TestHandleGetGroupsFromServiceSaveInCache(t *testing.T) {
	var (
		app        = fiber.New()
		groupCache = cache.New[string, []Group]()
		handler    = NewGroupHandler(&MockGroupService{}, groupCache)
	)

	assert.Zero(t, groupCache.Count())

	app.Get("/", handler.HandleGetGroups)

	resp, _ := app.Test(httptest.NewRequest("GET", "/", nil), -1)
	body, _ := io.ReadAll(resp.Body)

	result := make([]Group, 0)
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
	var (
		app        = fiber.New()
		groupCache = cache.New[string, []Group]()
		handler    = NewGroupHandler(&MockGroupService{}, groupCache)
	)

	groupCache.Put("/", []Group{{Name: "group-2"}})

	app.Get("/", handler.HandleGetGroups)

	resp, _ := app.Test(httptest.NewRequest("GET", "/", nil), -1)
	body, _ := io.ReadAll(resp.Body)

	result := make([]Group, 0)
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
		groupCache = cache.New[string, []Group]()
		handler    = NewGroupHandler(&MockGroupService{empty: true}, groupCache)
	)

	app.Get("/", handler.HandleGetGroups)

	resp, _ := app.Test(httptest.NewRequest("GET", "/", nil), -1)
	body, _ := io.ReadAll(resp.Body)

	result := make([]Group, 0)
	err := json.Unmarshal(body, &result)
	if err != nil {
		t.Fatal(err.Error())
	}

	assert.Equal(t, fiber.StatusOK, resp.StatusCode)
	assert.Empty(t, result)

	_, found := groupCache.GetIfPresent("/")
	assert.False(t, found)
}
