package server

import (
	"log"
	"os"

	"github.com/goccy/go-json"
	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/logger"
	"github.com/gofiber/fiber/v2/middleware/monitor"
	"github.com/gofiber/fiber/v2/middleware/recover"
	"github.com/larscom/gitlab-ci-dashboard/branch"
	"github.com/larscom/gitlab-ci-dashboard/config"
	"github.com/larscom/gitlab-ci-dashboard/group"
	"github.com/larscom/gitlab-ci-dashboard/pipeline"
	"github.com/larscom/gitlab-ci-dashboard/project"
	"github.com/xanzy/go-gitlab"
)

type serverContext struct {
	config        *config.GitlabConfig
	gitlabClient  *gitlab.Client
	cacheContext  *cacheConfig
	clientContext *clientConfig
}

func newServerContext(
	config *config.GitlabConfig,
	gitlabClient *gitlab.Client,
	cacheContext *cacheConfig,
	clientContext *clientConfig,
) *serverContext {
	return &serverContext{
		config,
		gitlabClient,
		cacheContext,
		clientContext,
	}
}

func NewServer() *fiber.App {
	config := config.NewGitlabConfig()
	server := fiber.New(fiber.Config{
		JSONEncoder: json.Marshal,
		JSONDecoder: json.Unmarshal,
	})
	server.Use(logger.New())
	server.Use(recover.New())

	server.Static("/", "./static")
	server.Get("/metrics", monitor.New(monitor.Config{Title: "Gitlab CI Dashboard Metrics"}))

	client, err := gitlab.NewClient(config.GitlabToken, gitlab.WithBaseURL(config.GitlabUrl))
	if err != nil {
		log.Panicf("failed to create gitlab client: %v", err)
	}

	clientConf := newClientConfig(
		project.NewProjectClient(client),
		group.NewGroupClient(client, config),
		pipeline.NewPipelineClient(client),
		branch.NewBranchClient(client),
	)
	cacheConf := newCacheConfig(config, clientConf)
	serverCtx := newServerContext(config, client, cacheConf, clientConf)

	api := server.Group("/api")
	serverCtx.setupVersionHandler(api)

	serverCtx.setupBranchHandler(api.Group("/branches"))
	serverCtx.setupPipelineHandler(api.Group("/pipelines"))
	serverCtx.setupGroupHandler(api.Group("/groups"))

	return server
}

func (s *serverContext) setupBranchHandler(router fiber.Router) {
	service := branch.NewBranchService(s.cacheContext.pipelineLatestLoader, s.cacheContext.branchLoader)
	handler := branch.NewBranchHandler(service)

	// path: /api/branches/:projectId
	router.Get("/:projectId", handler.HandleGetBranchesWithLatestPipeline)
}

func (s *serverContext) setupPipelineHandler(router fiber.Router) {
	handler := pipeline.NewPipelineHandler(s.cacheContext.pipelineLatestLoader)

	// path: /api/pipelines/:projectId/:ref
	router.Get("/:projectId/:ref", handler.HandleGetLatestPipeline)
}

func (s *serverContext) setupGroupHandler(router fiber.Router) {
	service := group.NewGroupService(s.config, s.clientContext.groupClient)
	handler := group.NewGroupHandler(service, s.cacheContext.groupCache)

	// path: /api/groups
	router.Get("/", handler.HandleGetGroups)

	s.setupProjectHandler(router)
}

func (s *serverContext) setupProjectHandler(router fiber.Router) {
	service := project.NewProjectService(
		s.config,
		s.cacheContext.projectLoader,
		s.cacheContext.pipelineLatestLoader,
	)

	handler := project.NewProjectHandler(service)

	// path: /api/groups/:groupId/projects
	router.Get("/:groupId/projects", handler.HandleGetProjects)
}

func (s *serverContext) setupVersionHandler(router fiber.Router) {
	// path: /api/version
	router.Get("/version", func(c *fiber.Ctx) error {
		return c.SendString(os.Getenv("VERSION"))
	})
}
