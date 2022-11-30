package server

import (
	"time"

	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"
	"github.com/larscom/gitlab-ci-dashboard/config"
	"github.com/larscom/gitlab-ci-dashboard/group"
	"github.com/larscom/gitlab-ci-dashboard/pipeline"
	"github.com/larscom/gitlab-ci-dashboard/project"
	"github.com/xanzy/go-gitlab"
)

func NewServer(client *gitlab.Client, appCofig *config.AppConfig) *echo.Echo {
	server := echo.New()
	server.Debug = true

	server.Use(middleware.Static("./statics"))
	server.Use(middleware.Recover())

	cache := NewCacheMiddleware(time.Duration(10) * time.Second).Middleware()

	pipelineService := pipeline.NewPipelineService(client)

	apiGroup := server.Group("/api")
	{
		groupsGroup := apiGroup.Group("/groups")
		{
			groupsGroup.Use(cache)

			// path: /api/groups
			handler := group.NewGroupController(group.NewGroupService(client, appCofig))
			groupsGroup.GET("", handler.GetGroups)

			projectsGroup := groupsGroup.Group("/:groupId/projects")
			{
				// path: /api/groups/{gid}/projects
				handler := project.NewProjectController(project.NewProjectService(client, pipelineService))
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

	server.Use(middleware.Logger())

	return server
}
