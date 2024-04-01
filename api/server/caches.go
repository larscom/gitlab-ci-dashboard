package server

import (
	"context"
	"time"

	"github.com/larscom/gitlab-ci-dashboard/job"
	"github.com/larscom/gitlab-ci-dashboard/model"
	"github.com/larscom/gitlab-ci-dashboard/pipeline"

	"github.com/larscom/gitlab-ci-dashboard/config"

	ldgc "github.com/larscom/go-loading-cache"
)

type Caches struct {
	groupCache ldgc.Cache[string, []model.Group]

	pipelineLatestLoader ldgc.LoadingCache[pipeline.Key, *model.Pipeline]
	pipelinesLoader      ldgc.LoadingCache[int, []model.Pipeline]
	projectsLoader       ldgc.LoadingCache[int, []model.Project]
	branchesLoader       ldgc.LoadingCache[int, []model.Branch]
	schedulesLoader      ldgc.LoadingCache[int, []model.Schedule]
	jobsLoader           ldgc.LoadingCache[job.Key, []model.Job]
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

func createGroupCache(cfg *config.GitlabConfig) ldgc.Cache[string, []model.Group] {
	ttl := time.Second * time.Duration(cfg.GroupCacheTTLSeconds)
	return ldgc.NewCache(ldgc.WithExpireAfterWrite[string, []model.Group](ttl))
}

func createSchedulesLoader(cfg *config.GitlabConfig, c *Clients) ldgc.LoadingCache[int, []model.Schedule] {
	ttl := time.Second * time.Duration(cfg.ScheduleCacheTTLSeconds)

	loaderFunc := func(projectId int) ([]model.Schedule, error) {
		return c.scheduleClient.GetPipelineSchedules(projectId, context.Background())
	}

	return ldgc.NewLoadingCache(loaderFunc, ldgc.WithExpireAfterWrite[int, []model.Schedule](ttl))
}

func createJobsLoader(cfg *config.GitlabConfig, c *Clients) ldgc.LoadingCache[job.Key, []model.Job] {
	ttl := time.Second * time.Duration(cfg.JobCacheTTLSeconds)

	loaderFunc := func(jobKey job.Key) ([]model.Job, error) {
		projectId, pipelineId, scope := jobKey.Parse()
		return c.jobClient.GetJobs(projectId, pipelineId, scope, context.Background())
	}

	return ldgc.NewLoadingCache(loaderFunc, ldgc.WithExpireAfterWrite[job.Key, []model.Job](ttl))
}

func createBranchesLoader(cfg *config.GitlabConfig, c *Clients) ldgc.LoadingCache[int, []model.Branch] {
	ttl := time.Second * time.Duration(cfg.BranchCacheTTLSeconds)

	loaderFunc := func(projectId int) ([]model.Branch, error) {
		return c.branchClient.GetBranches(projectId, context.Background())
	}

	return ldgc.NewLoadingCache(loaderFunc, ldgc.WithExpireAfterWrite[int, []model.Branch](ttl))
}

func createProjectsLoader(cfg *config.GitlabConfig, c *Clients) ldgc.LoadingCache[int, []model.Project] {
	ttl := time.Second * time.Duration(cfg.ProjectCacheTTLSeconds)

	loaderFunc := func(groupId int) ([]model.Project, error) {
		return c.projectClient.GetProjects(groupId, context.Background())
	}

	return ldgc.NewLoadingCache(loaderFunc, ldgc.WithExpireAfterWrite[int, []model.Project](ttl))
}

func createPipelineLatestLoader(cfg *config.GitlabConfig, c *Clients) ldgc.LoadingCache[pipeline.Key, *model.Pipeline] {
	ttl := time.Second * time.Duration(cfg.PipelineCacheTTLSeconds)

	loaderFunc := func(pipelineKey pipeline.Key) (*model.Pipeline, error) {
		id, ref, source := pipelineKey.Parse()
		if source != nil {
			return c.pipelineClient.GetLatestPipelineBySource(id, ref, *source)
		}
		return c.pipelineClient.GetLatestPipeline(id, ref)
	}

	return ldgc.NewLoadingCache(loaderFunc, ldgc.WithExpireAfterWrite[pipeline.Key, *model.Pipeline](ttl))
}

func createPipelinesLoader(cfg *config.GitlabConfig, c *Clients) ldgc.LoadingCache[int, []model.Pipeline] {
	ttl := time.Second * time.Duration(cfg.PipelineCacheTTLSeconds)

	loaderFunc := func(projectId int) ([]model.Pipeline, error) {
		return c.pipelineClient.GetPipelines(projectId, context.Background())
	}

	return ldgc.NewLoadingCache(loaderFunc, ldgc.WithExpireAfterWrite[int, []model.Pipeline](ttl))
}
