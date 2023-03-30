package server

import (
	"github.com/goccy/go-json"
	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/logger"
	"github.com/gofiber/fiber/v2/middleware/monitor"
	"github.com/gofiber/fiber/v2/middleware/recover"
)

func NewServer(ctx *Bootstrap) *fiber.App {
	server := fiber.New(fiber.Config{
		JSONEncoder: json.Marshal,
		JSONDecoder: json.Unmarshal,
	})
	server.Use(logger.New())
	server.Use(recover.New())

	server.Static("/", "./static")
	server.Get("/metrics", monitor.New(monitor.Config{Title: "Gitlab CI Dashboard Metrics"}))

	api := server.Group("/api")
	ctx.setupVersionHandler(api)

	ctx.setupBranchHandler(api.Group("/branches"))
	ctx.setupPipelineHandler(api.Group("/pipelines"))
	ctx.setupGroupHandler(api.Group("/groups"))

	return server
}
