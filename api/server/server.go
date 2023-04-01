package server

import (
	"github.com/goccy/go-json"
	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/logger"
	"github.com/gofiber/fiber/v2/middleware/recover"
)

func NewServer(ctx *Bootstrap) *fiber.App {
	app := fiber.New(fiber.Config{
		JSONEncoder: json.Marshal,
		JSONDecoder: json.Unmarshal,
	})
	app.Use(logger.New())
	app.Use(recover.New())

	app.Static("/", "./static")
	ctx.setupPrometheusHandler(app)
	ctx.setupFiberMetricsHandler(app)

	api := app.Group("/api")
	ctx.setupVersionHandler(api)

	ctx.setupBranchHandler(api.Group("/branches"))
	ctx.setupPipelineHandler(api.Group("/pipelines"))
	ctx.setupGroupHandler(api.Group("/groups"))

	return app
}
