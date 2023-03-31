package server

import (
	"time"

	"github.com/larscom/gitlab-ci-dashboard/config"
	"github.com/larscom/gitlab-ci-dashboard/model"
	"github.com/larscom/go-cache"
)

type Caches struct {
	pipelineLatestLoader cache.Cache[model.PipelineKey, *model.Pipeline]
	projectLoader        cache.Cache[model.GroupId, []*model.Project]
	branchLoader         cache.Cache[model.ProjectId, []*model.Branch]
	groupCache           cache.Cache[string, []*model.Group]
}

func NewCaches(config *config.GitlabConfig, clients *Clients) *Caches {
	return &Caches{
		pipelineLatestLoader: createPipelineLatestLoader(config, clients),
		projectLoader:        createProjectLoader(config, clients),
		branchLoader:         createBranchLoader(config, clients),
		groupCache:           createGroupCache(config),
	}
}

func createGroupCache(cfg *config.GitlabConfig) cache.Cache[string, []*model.Group] {
	ttl := time.Second * time.Duration(cfg.GroupCacheTTLSeconds)
	return cache.NewCache(cache.WithExpireAfterWrite[string, []*model.Group](ttl))
}

func createBranchLoader(cfg *config.GitlabConfig, c *Clients) cache.Cache[model.ProjectId, []*model.Branch] {
	return cache.NewCache(
		cache.WithExpireAfterWrite[model.ProjectId, []*model.Branch](time.Second*time.Duration(cfg.BranchCacheTTLSeconds)),
		cache.WithLoader(func(projectId model.ProjectId) ([]*model.Branch, error) {
			return c.branchClient.GetBranches(int(projectId)), nil
		}))
}

func createProjectLoader(cfg *config.GitlabConfig, c *Clients) cache.Cache[model.GroupId, []*model.Project] {
	return cache.NewCache(
		cache.WithExpireAfterWrite[model.GroupId, []*model.Project](time.Second*time.Duration(cfg.ProjectCacheTTLSeconds)),
		cache.WithLoader(func(groupId model.GroupId) ([]*model.Project, error) {
			return c.projectClient.GetProjects(int(groupId)), nil
		}))
}

func createPipelineLatestLoader(cfg *config.GitlabConfig, c *Clients) cache.Cache[model.PipelineKey, *model.Pipeline] {
	return cache.NewCache(
		cache.WithExpireAfterWrite[model.PipelineKey, *model.Pipeline](time.Second*time.Duration(cfg.PipelineCacheTTLSeconds)),
		cache.WithLoader(func(pipelineKey model.PipelineKey) (*model.Pipeline, error) {
			id, ref := pipelineKey.Parse()
			pipeline, _ := c.pipelineClient.GetLatestPipeline(id, ref)
			return pipeline, nil
		}))
}
