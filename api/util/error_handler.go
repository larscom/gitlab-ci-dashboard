package util

import (
	"log/slog"

	"github.com/gofiber/fiber/v2"
	"github.com/xanzy/go-gitlab"
)

func HandleError[T any](value T, r *gitlab.Response, err error) (T, *gitlab.Response, error) {
	if r == nil {
		const msg = "no response from the gitlab API"
		slog.Error(msg, "error", err.Error())
		return value, nil, fiber.NewError(fiber.StatusGatewayTimeout, msg)
	}

	switch r.StatusCode {
	case fiber.StatusUnauthorized:
		const msg = "access token is invalid or has expired"
		slog.Error(msg, "error", err.Error())
		err = fiber.NewError(fiber.StatusInternalServerError, msg)
	case fiber.StatusForbidden:
		slog.Debug("no access to requested resource", "url", r.Request.URL.String(), "error", err.Error())
		err = nil
	case fiber.StatusNotFound:
		slog.Debug("requested resource could not be found", "url", r.Request.URL.String(), "error", err.Error())
		err = nil
	default:
		const msg = "unexpected error occurred"
		slog.Error(msg, "error", err.Error())
		err = fiber.NewError(fiber.StatusInternalServerError, msg)
	}

	return value, r, err
}
