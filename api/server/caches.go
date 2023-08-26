package server

import (
	"github.com/larscom/gitlab-ci-dashboard/data"
	"github.com/larscom/gitlab-ci-dashboard/pipeline"
	"time"

	"github.com/larscom/gitlab-ci-dashboard/config"

	"github.com/larscom/go-cache"
)

type Caches struct {
	groupCache cache.Cache[string, []data.Group]

	pipelineLatestLoader cache.Cache[pipeline.Key, *data.Pipeline]
	pipelinesLoader      cache.Cache[int, []data.Pipeline]
	projectsLoader       cache.Cache[int, []data.Project]
	branchesLoader       cache.Cache[int, []data.Branch]
	schedulesLoader      cache.Cache[int, []data.Schedule]
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

func createGroupCache(cfg *config.GitlabConfig) cache.Cache[string, []data.Group] {
	ttl := time.Second * time.Duration(cfg.GroupCacheTTLSeconds)
	return cache.New(cache.WithExpireAfterWrite[string, []data.Group](ttl))
}

func createSchedulesLoader(cfg *config.GitlabConfig, c *Clients) cache.Cache[int, []data.Schedule] {
	return cache.New(
		cache.WithExpireAfterWrite[int, []data.Schedule](time.Second*time.Duration(cfg.ScheduleCacheTTLSeconds)),
		cache.WithLoader(func(projectId int) ([]data.Schedule, error) {
			return c.scheduleClient.GetPipelineSchedules(projectId), nil
		}))
}

func createBranchesLoader(cfg *config.GitlabConfig, c *Clients) cache.Cache[int, []data.Branch] {
	return cache.New(
		cache.WithExpireAfterWrite[int, []data.Branch](time.Second*time.Duration(cfg.BranchCacheTTLSeconds)),
		cache.WithLoader(func(projectId int) ([]data.Branch, error) {
			return c.branchClient.GetBranches(projectId), nil
		}))
}

func createProjectsLoader(cfg *config.GitlabConfig, c *Clients) cache.Cache[int, []data.Project] {
	return cache.New(
		cache.WithExpireAfterWrite[int, []data.Project](time.Second*time.Duration(cfg.ProjectCacheTTLSeconds)),
		cache.WithLoader(func(groupId int) ([]data.Project, error) {
			return c.projectClient.GetProjects(groupId), nil
		}))
}

func createPipelineLatestLoader(cfg *config.GitlabConfig, c *Clients) cache.Cache[pipeline.Key, *data.Pipeline] {
	return cache.New(
		cache.WithExpireAfterWrite[pipeline.Key, *data.Pipeline](time.Second*time.Duration(cfg.PipelineCacheTTLSeconds)),
		cache.WithLoader(func(pipelineKey pipeline.Key) (*data.Pipeline, error) {
			id, ref, source := pipelineKey.Parse()

			if source != nil {
				pipeline, _ := c.pipelineClient.GetLatestPipelineBySource(id, ref, *source)
				return pipeline, nil
			}

			pipeline, _ := c.pipelineClient.GetLatestPipeline(id, ref)
			return pipeline, nil
		}))
}

func createPipelinesLoader(cfg *config.GitlabConfig, c *Clients) cache.Cache[int, []data.Pipeline] {
	return cache.New(
		cache.WithExpireAfterWrite[int, []data.Pipeline](time.Second*time.Duration(cfg.PipelineCacheTTLSeconds)),
		cache.WithLoader(func(projectId int) ([]data.Pipeline, error) {
			pipelines := c.pipelineClient.GetPipelines(projectId)
			return pipelines, nil
		}))
}
