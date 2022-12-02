package server

import (
	"os"
	"time"

	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"
	"github.com/larscom/gitlab-ci-dashboard/config"
	"github.com/larscom/gitlab-ci-dashboard/group"
	"github.com/larscom/gitlab-ci-dashboard/pipeline"
	"github.com/larscom/gitlab-ci-dashboard/project"
	"github.com/rs/zerolog"
	"github.com/xanzy/go-gitlab"
)

func NewServer(client *gitlab.Client, serverConfig *config.ServerConfig, gitlabConfig *config.GitlabConfig) *echo.Echo {
	server := echo.New()
	server.Debug = serverConfig.Debug

	server.Use(middleware.Static("./statics"))
	server.Use(middleware.Recover())
	server.Use(NewCacheMiddleware(time.Duration(serverConfig.CacheTTLSeconds) * time.Second).Middleware())

	logger := zerolog.New(os.Stdout)

	pipelineService := pipeline.NewPipelineService(client, logger)

	apiGroup := server.Group("/api")
	{
		groupsGroup := apiGroup.Group("/groups")
		{
			// path: /api/groups
			handler := group.NewGroupController(group.NewGroupService(client, logger, gitlabConfig))
			groupsGroup.GET("", handler.GetGroups)

			projectsGroup := groupsGroup.Group("/:groupId/projects")
			{
				// path: /api/groups/{gid}/projects
				handler := project.NewProjectController(project.NewProjectService(client, logger, pipelineService))
				projectsGroup.GET("", handler.GetProjectsWithPipelines)

				pipelinesGroup := projectsGroup.Group("/:projectId/pipelines")
				{
					// path: /api/groups/{gid}/projects/{pid}/pipelines/{ref}
					handler := pipeline.NewPipelineController(pipelineService)
					pipelinesGroup.GET("/:ref", handler.GetPipelines)
				}
			}
		}
	}

	if serverConfig.Debug {
		server.Use(middleware.RequestLoggerWithConfig(middleware.RequestLoggerConfig{
			LogURI:    true,
			LogStatus: true,
			LogValuesFunc: func(c echo.Context, v middleware.RequestLoggerValues) error {
				logger.Debug().Timestamp().Str("URI", v.URI).Int("status", v.Status).Msg(c.Request().Method)
				return nil
			},
		}))
	}

	return server
}
