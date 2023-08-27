package util

import (
	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/log"
	"github.com/xanzy/go-gitlab"
)

func HandleError[T any](value T, r *gitlab.Response, err error) (T, *gitlab.Response, error) {
	if r == nil {
		const msg = "no response from gitlab"
		log.Debug(msg)
		return value, nil, fiber.NewError(fiber.StatusGatewayTimeout, msg)
	}

	switch r.StatusCode {
	case fiber.StatusUnauthorized:
		const msg = "access token is invalid or has expired"
		log.Debug(msg)
		err = fiber.NewError(fiber.StatusInternalServerError, msg)
	case fiber.StatusForbidden:
		err = nil
	case fiber.StatusNotFound:
		log.Debug("requested resource could not be found: ", r.Request.URL)
		err = nil
	default:
		msg := err.Error()
		log.Debug(msg)
		err = fiber.NewError(fiber.StatusInternalServerError, msg)
	}

	return value, r, err
}
