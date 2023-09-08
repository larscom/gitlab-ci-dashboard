package server

import (
	"github.com/larscom/gitlab-ci-dashboard/model"
	"github.com/larscom/gitlab-ci-dashboard/pipeline"
	"time"

	"github.com/larscom/gitlab-ci-dashboard/config"

	"github.com/larscom/go-cache"
)

type Caches struct {
	groupCache cache.Cacher[string, []model.Group]

	pipelineLatestLoader cache.Cacher[pipeline.Key, *model.Pipeline]
	pipelinesLoader      cache.Cacher[model.ProjectId, []model.Pipeline]
	projectsLoader       cache.Cacher[model.GroupId, []model.Project]
	branchesLoader       cache.Cacher[model.ProjectId, []model.Branch]
	schedulesLoader      cache.Cacher[model.ProjectId, []model.Schedule]
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

func createGroupCache(cfg *config.GitlabConfig) cache.Cacher[string, []model.Group] {
	ttl := time.Second * time.Duration(cfg.GroupCacheTTLSeconds)
	return cache.New(cache.WithExpireAfterWrite[string, []model.Group](ttl))
}

func createSchedulesLoader(cfg *config.GitlabConfig, c *Clients) cache.Cacher[model.ProjectId, []model.Schedule] {
	return cache.New(
		cache.WithExpireAfterWrite[model.ProjectId, []model.Schedule](time.Second*time.Duration(cfg.ScheduleCacheTTLSeconds)),
		cache.WithLoader(func(id model.ProjectId) ([]model.Schedule, error) {
			return c.scheduleClient.GetPipelineSchedules(id)
		}))
}

func createBranchesLoader(cfg *config.GitlabConfig, c *Clients) cache.Cacher[model.ProjectId, []model.Branch] {
	return cache.New(
		cache.WithExpireAfterWrite[model.ProjectId, []model.Branch](time.Second*time.Duration(cfg.BranchCacheTTLSeconds)),
		cache.WithLoader(func(id model.ProjectId) ([]model.Branch, error) {
			return c.branchClient.GetBranches(id)
		}))
}

func createProjectsLoader(cfg *config.GitlabConfig, c *Clients) cache.Cacher[model.GroupId, []model.Project] {
	return cache.New(
		cache.WithExpireAfterWrite[model.GroupId, []model.Project](time.Second*time.Duration(cfg.ProjectCacheTTLSeconds)),
		cache.WithLoader(func(id model.GroupId) ([]model.Project, error) {
			return c.projectClient.GetProjects(id)
		}))
}

func createPipelineLatestLoader(cfg *config.GitlabConfig, c *Clients) cache.Cacher[pipeline.Key, *model.Pipeline] {
	return cache.New(
		cache.WithExpireAfterWrite[pipeline.Key, *model.Pipeline](time.Second*time.Duration(cfg.PipelineCacheTTLSeconds)),
		cache.WithLoader(func(pipelineKey pipeline.Key) (*model.Pipeline, error) {
			id, ref, source := pipelineKey.Parse()
			if source != nil {
				return c.pipelineClient.GetLatestPipelineBySource(id, ref, *source)
			}
			return c.pipelineClient.GetLatestPipeline(id, ref)
		}))
}

func createPipelinesLoader(cfg *config.GitlabConfig, c *Clients) cache.Cacher[model.ProjectId, []model.Pipeline] {
	return cache.New(
		cache.WithExpireAfterWrite[model.ProjectId, []model.Pipeline](time.Second*time.Duration(cfg.PipelineCacheTTLSeconds)),
		cache.WithLoader(func(id model.ProjectId) ([]model.Pipeline, error) {
			return c.pipelineClient.GetPipelines(id)
		}))
}
