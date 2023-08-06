package server

import (
	"os"

	"github.com/ansrivas/fiberprometheus/v2"
	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/monitor"
	"github.com/larscom/gitlab-ci-dashboard/branch"
	"github.com/larscom/gitlab-ci-dashboard/client"
	"github.com/larscom/gitlab-ci-dashboard/config"
	"github.com/larscom/gitlab-ci-dashboard/group"
	"github.com/larscom/gitlab-ci-dashboard/project"
	"github.com/larscom/gitlab-ci-dashboard/schedule"
)

type Bootstrap struct {
	config  *config.GitlabConfig
	client  client.GitlabClient
	caches  *Caches
	clients *Clients
}

func NewBootstrap(
	config *config.GitlabConfig,
	client client.GitlabClient,
	caches *Caches,
	clients *Clients,
) *Bootstrap {
	return &Bootstrap{
		config,
		client,
		caches,
		clients,
	}
}

func (b *Bootstrap) setupProjectHandler(router fiber.Router) {
	service := project.NewProjectService(
		b.config,
		b.caches.projectLoader,
		b.caches.pipelineLatestLoader,
	)

	handler := project.NewProjectHandler(service)

	// path: /api/projects/latest-pipelines?groupId={groupId}
	router.Get("/projects/latest-pipelines", handler.HandleGetProjectsWithLatestPipeline)
}

func (b *Bootstrap) setupBranchHandler(router fiber.Router) {
	service := branch.NewBranchService(b.caches.pipelineLatestLoader, b.caches.branchLoader)
	handler := branch.NewBranchHandler(service)

	// path: /api/branches/latest-pipelines?projectId={projectId}
	router.Get("/branches/latest-pipelines", handler.HandleGetBranchesWithLatestPipeline)
}

func (b *Bootstrap) setupSchedulesHandler(router fiber.Router) {
	service := schedule.NewScheduleService(
		b.caches.projectLoader,
		b.caches.scheduleLoader,
		b.caches.pipelineLatestLoader,
	)
	handler := schedule.NewScheduleHandler(service)

	// path: /api/schedules?groupId={groupId}
	router.Get("/schedules", handler.HandleGetSchedules)
}

func (b *Bootstrap) setupGroupHandler(router fiber.Router) {
	service := group.NewGroupService(b.config, b.clients.groupClient)
	handler := group.NewGroupHandler(service, b.caches.groupCache)

	// path: /api/groups
	router.Get("/groups", handler.HandleGetGroups)

}

func (b *Bootstrap) setupVersionHandler(router fiber.Router) {
	// path: /api/version
	router.Get("/version", func(c *fiber.Ctx) error {
		return c.SendString(os.Getenv("VERSION"))
	})
}

func (b *Bootstrap) setupPrometheusHandler(router fiber.Router) {
	// path: /metrics/prometheus
	prometheus := fiberprometheus.New("gitlab-ci-dashboard")
	prometheus.RegisterAt(router, "/metrics/prometheus")
	router.Use(prometheus.Middleware)
}

func (b *Bootstrap) setupFiberMetricsHandler(router fiber.Router) {
	// path: /metrics
	router.Get("/metrics", monitor.New(monitor.Config{Title: "Gitlab CI Dashboard Metrics"}))
}
