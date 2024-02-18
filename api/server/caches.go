package server

import (
	"context"
	"time"

	"github.com/larscom/gitlab-ci-dashboard/job"
	"github.com/larscom/gitlab-ci-dashboard/model"
	"github.com/larscom/gitlab-ci-dashboard/pipeline"

	"github.com/larscom/gitlab-ci-dashboard/config"

	"github.com/larscom/go-cache"
)

type Caches struct {
	groupCache cache.Cache[string, []model.Group]

	pipelineLatestLoader cache.Cache[pipeline.Key, *model.Pipeline]
	pipelinesLoader      cache.Cache[int, []model.Pipeline]
	projectsLoader       cache.Cache[int, []model.Project]
	branchesLoader       cache.Cache[int, []model.Branch]
	schedulesLoader      cache.Cache[int, []model.Schedule]
	jobsLoader           cache.Cache[job.Key, []model.Job]
}

func NewCaches(config *config.GitlabConfig, clients *Clients) *Caches {
	return &Caches{
		groupCache: createGroupCache(config),

		pipelineLatestLoader: createPipelineLatestLoader(config, clients),
		pipelinesLoader:      createPipelinesLoader(config, clients),

		projectsLoader:  createProjectsLoader(config, clients),
		branchesLoader:  createBranchesLoader(config, clients),
		schedulesLoader: createSchedulesLoader(config, clients),
		jobsLoader:      createJobsLoader(config, clients),
	}
}

func createGroupCache(cfg *config.GitlabConfig) cache.Cache[string, []model.Group] {
	ttl := time.Second * time.Duration(cfg.GroupCacheTTLSeconds)
	return cache.New(cache.WithExpireAfterWrite[string, []model.Group](ttl))
}

func createSchedulesLoader(cfg *config.GitlabConfig, c *Clients) cache.Cache[int, []model.Schedule] {
	return cache.New(
		cache.WithExpireAfterWrite[int, []model.Schedule](time.Second*time.Duration(cfg.ScheduleCacheTTLSeconds)),
		cache.WithLoader(func(projectId int) ([]model.Schedule, error) {
			return c.scheduleClient.GetPipelineSchedules(projectId, context.Background())
		}))
}

func createJobsLoader(cfg *config.GitlabConfig, c *Clients) cache.Cache[job.Key, []model.Job] {
	return cache.New(
		cache.WithExpireAfterWrite[job.Key, []model.Job](time.Second*time.Duration(cfg.JobCacheTTLSeconds)),
		cache.WithLoader(func(jobKey job.Key) ([]model.Job, error) {
			projectId, pipelineId, scope := jobKey.Parse()
			return c.jobClient.GetJobs(projectId, pipelineId, scope, context.Background())
		}))
}

func createBranchesLoader(cfg *config.GitlabConfig, c *Clients) cache.Cache[int, []model.Branch] {
	return cache.New(
		cache.WithExpireAfterWrite[int, []model.Branch](time.Second*time.Duration(cfg.BranchCacheTTLSeconds)),
		cache.WithLoader(func(projectId int) ([]model.Branch, error) {
			return c.branchClient.GetBranches(projectId, context.Background())
		}))
}

func createProjectsLoader(cfg *config.GitlabConfig, c *Clients) cache.Cache[int, []model.Project] {
	return cache.New(
		cache.WithExpireAfterWrite[int, []model.Project](time.Second*time.Duration(cfg.ProjectCacheTTLSeconds)),
		cache.WithLoader(func(groupId int) ([]model.Project, error) {
			return c.projectClient.GetProjects(groupId, context.Background())
		}))
}

func createPipelineLatestLoader(cfg *config.GitlabConfig, c *Clients) cache.Cache[pipeline.Key, *model.Pipeline] {
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

func createPipelinesLoader(cfg *config.GitlabConfig, c *Clients) cache.Cache[int, []model.Pipeline] {
	return cache.New(
		cache.WithExpireAfterWrite[int, []model.Pipeline](time.Second*time.Duration(cfg.PipelineCacheTTLSeconds)),
		cache.WithLoader(func(projectId int) ([]model.Pipeline, error) {
			return c.pipelineClient.GetPipelines(projectId, context.Background())
		}))
}
