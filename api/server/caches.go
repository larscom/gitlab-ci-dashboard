package server

import (
	"github.com/larscom/gitlab-ci-dashboard/branch"
	"github.com/larscom/gitlab-ci-dashboard/group"
	"github.com/larscom/gitlab-ci-dashboard/pipeline"
	"github.com/larscom/gitlab-ci-dashboard/project"
	"github.com/larscom/gitlab-ci-dashboard/schedule"
	"time"

	"github.com/larscom/gitlab-ci-dashboard/config"

	"github.com/larscom/go-cache"
)

type Caches struct {
	groupCache cache.Cache[string, []group.Group]

	pipelineLatestLoader cache.Cache[pipeline.Key, *pipeline.Pipeline]
	pipelinesLoader      cache.Cache[int, []pipeline.Pipeline]
	projectsLoader       cache.Cache[int, []project.Project]
	branchesLoader       cache.Cache[int, []branch.Branch]
	schedulesLoader      cache.Cache[int, []schedule.Schedule]
}

func NewCaches(config *config.GitlabConfig, clients *Clients) *Caches {
	return &Caches{
		groupCache: createGroupCache(config),

		pipelineLatestLoader: createPipelineLatestLoader(config, clients),
		pipelinesLoader:      createPipelinesLoader(config, clients),

		projectsLoader:  createProjectsLoader(config, clients),
		branchesLoader:  createBranchesLoader(config, clients),
		schedulesLoader: createSchedulesLoader(config, clients),
	}
}

func createGroupCache(cfg *config.GitlabConfig) cache.Cache[string, []group.Group] {
	ttl := time.Second * time.Duration(cfg.GroupCacheTTLSeconds)
	return cache.New(cache.WithExpireAfterWrite[string, []group.Group](ttl))
}

func createSchedulesLoader(cfg *config.GitlabConfig, c *Clients) cache.Cache[int, []schedule.Schedule] {
	return cache.New(
		cache.WithExpireAfterWrite[int, []schedule.Schedule](time.Second*time.Duration(cfg.ScheduleCacheTTLSeconds)),
		cache.WithLoader(func(projectId int) ([]schedule.Schedule, error) {
			return c.scheduleClient.GetPipelineSchedules(projectId), nil
		}))
}

func createBranchesLoader(cfg *config.GitlabConfig, c *Clients) cache.Cache[int, []branch.Branch] {
	return cache.New(
		cache.WithExpireAfterWrite[int, []branch.Branch](time.Second*time.Duration(cfg.BranchCacheTTLSeconds)),
		cache.WithLoader(func(projectId int) ([]branch.Branch, error) {
			return c.branchClient.GetBranches(projectId), nil
		}))
}

func createProjectsLoader(cfg *config.GitlabConfig, c *Clients) cache.Cache[int, []project.Project] {
	return cache.New(
		cache.WithExpireAfterWrite[int, []project.Project](time.Second*time.Duration(cfg.ProjectCacheTTLSeconds)),
		cache.WithLoader(func(groupId int) ([]project.Project, error) {
			return c.projectClient.GetProjects(groupId), nil
		}))
}

func createPipelineLatestLoader(cfg *config.GitlabConfig, c *Clients) cache.Cache[pipeline.Key, *pipeline.Pipeline] {
	return cache.New(
		cache.WithExpireAfterWrite[pipeline.Key, *pipeline.Pipeline](time.Second*time.Duration(cfg.PipelineCacheTTLSeconds)),
		cache.WithLoader(func(pipelineKey pipeline.Key) (*pipeline.Pipeline, error) {
			id, ref, source := pipelineKey.Parse()

			if source != nil {
				pipeline, _ := c.pipelineClient.GetLatestPipelineBySource(id, ref, *source)
				return pipeline, nil
			}

			pipeline, _ := c.pipelineClient.GetLatestPipeline(id, ref)
			return pipeline, nil
		}))
}

func createPipelinesLoader(cfg *config.GitlabConfig, c *Clients) cache.Cache[int, []pipeline.Pipeline] {
	return cache.New(
		cache.WithExpireAfterWrite[int, []pipeline.Pipeline](time.Second*time.Duration(cfg.PipelineCacheTTLSeconds)),
		cache.WithLoader(func(projectId int) ([]pipeline.Pipeline, error) {
			pipelines := c.pipelineClient.GetPipelines(projectId)
			return pipelines, nil
		}))
}
