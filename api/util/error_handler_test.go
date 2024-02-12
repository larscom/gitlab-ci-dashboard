package util

import (
	"errors"
	"net/http"
	"net/url"
	"testing"

	"github.com/gofiber/fiber/v2"
	"github.com/xanzy/go-gitlab"

	"github.com/stretchr/testify/assert"
)

func TestNoResponseToStatusGatewayTimeout(t *testing.T) {
	value, response, err := HandleError[*int](nil, nil, errors.New("ERROR"))

	assert.Nil(t, value)
	assert.Nil(t, response)
	assert.Equal(t, fiber.NewError(fiber.StatusGatewayTimeout, err.Error()), err)
}

func TestStatusUnauthorizedToStatusInternalServerError(t *testing.T) {
	r := &gitlab.Response{
		Response: &http.Response{
			StatusCode: fiber.StatusUnauthorized,
			Request: &http.Request{
				URL: new(url.URL),
			},
		},
	}

	value, response, err := HandleError[int](1, r, errors.New("ERROR"))

	assert.Equal(t, 1, value)
	assert.Equal(t, r, response)
	assert.Equal(t, fiber.NewError(fiber.StatusInternalServerError, err.Error()), err)
}

func TestStatusForbiddenToErrorNil(t *testing.T) {
	r := &gitlab.Response{
		Response: &http.Response{
			StatusCode: fiber.StatusForbidden,
			Request: &http.Request{
				URL: new(url.URL),
			},
		},
	}

	value, response, err := HandleError[int](1, r, errors.New("ERROR"))

	assert.Equal(t, 1, value)
	assert.Equal(t, r, response)
	assert.Nil(t, err)
}

func TestStatusNotFoundToErrorNil(t *testing.T) {
	r := &gitlab.Response{
		Response: &http.Response{
			StatusCode: fiber.StatusNotFound,
			Request: &http.Request{
				URL: new(url.URL),
			},
		},
	}

	value, response, err := HandleError[int](1, r, errors.New("ERROR"))

	assert.Equal(t, 1, value)
	assert.Equal(t, r, response)
	assert.Nil(t, err)
}

func TestAnyOtherErrorToStatusInternalServerError(t *testing.T) {
	r := &gitlab.Response{
		Response: &http.Response{
			StatusCode: fiber.StatusTeapot,
			Request: &http.Request{
				URL: new(url.URL),
			},
		},
	}

	value, response, err := HandleError[int](1, r, errors.New("ERROR"))

	assert.Equal(t, 1, value)
	assert.Equal(t, r, response)
	assert.Equal(t, fiber.NewError(fiber.StatusInternalServerError, err.Error()), err)
}
