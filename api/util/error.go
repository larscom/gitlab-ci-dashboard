package util

import (
	"github.com/gofiber/fiber/v2"
	"github.com/xanzy/go-gitlab"
	"log"
)

func HandleError[T any](value T, r *gitlab.Response, err error) (T, *gitlab.Response, error) {
	logger := log.Default()

	if r == nil {
		logger.Println("******************************************************")
		logger.Printf("no response from gitlab, err: %v\n", err)
		logger.Println("******************************************************")
		return value, nil, err
	}

	switch r.StatusCode {
	case fiber.StatusUnauthorized:
		logger.Println("******************************************************")
		logger.Println("unauthorized: token invalid/expired")
		logger.Println("******************************************************")
	case fiber.StatusForbidden:
		// do nothing
	case fiber.StatusNotFound:
		logger.Println("******************************************************")
		logger.Println("not found: requested resource can't be found")
		logger.Println("******************************************************")
	default:
		logger.Println("******************************************************")
		logger.Printf("invalid response from gitlab, err: %v\n", err)
		logger.Println("******************************************************")
	}

	return value, r, err
}
