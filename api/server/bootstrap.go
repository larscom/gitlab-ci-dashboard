package server

import (
	"os"

	"github.com/gofiber/fiber/v2"
	"github.com/larscom/gitlab-ci-dashboard/branch"
	"github.com/larscom/gitlab-ci-dashboard/client"
	"github.com/larscom/gitlab-ci-dashboard/config"
	"github.com/larscom/gitlab-ci-dashboard/group"
	"github.com/larscom/gitlab-ci-dashboard/pipeline"
	"github.com/larscom/gitlab-ci-dashboard/project"
)

type Bootstrap struct {
	config        *config.GitlabConfig
	client        client.GitlabClient
	cacheContext  *Caches
	clientContext *Clients
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

func (s *Bootstrap) setupBranchHandler(router fiber.Router) {
	service := branch.NewBranchService(s.cacheContext.pipelineLatestLoader, s.cacheContext.branchLoader)
	handler := branch.NewBranchHandler(service)

	// path: /api/branches/:projectId
	router.Get("/:projectId", handler.HandleGetBranchesWithLatestPipeline)
}

func (s *Bootstrap) setupPipelineHandler(router fiber.Router) {
	handler := pipeline.NewPipelineHandler(s.cacheContext.pipelineLatestLoader)

	// path: /api/pipelines/:projectId/:ref
	router.Get("/:projectId/:ref", handler.HandleGetLatestPipeline)
}

func (s *Bootstrap) setupGroupHandler(router fiber.Router) {
	service := group.NewGroupService(s.config, s.clientContext.groupClient)
	handler := group.NewGroupHandler(service, s.cacheContext.groupCache)

	// path: /api/groups
	router.Get("/", handler.HandleGetGroups)

	s.setupProjectHandler(router)
}

func (s *Bootstrap) setupProjectHandler(router fiber.Router) {
	service := project.NewProjectService(
		s.config,
		s.cacheContext.projectLoader,
		s.cacheContext.pipelineLatestLoader,
	)

	handler := project.NewProjectHandler(service)

	// path: /api/groups/:groupId/projects
	router.Get("/:groupId/projects", handler.HandleGetProjects)
}

func (s *Bootstrap) setupVersionHandler(router fiber.Router) {
	// path: /api/version
	router.Get("/version", func(c *fiber.Ctx) error {
		return c.SendString(os.Getenv("VERSION"))
	})
}
