package server

import (
	"time"

	"github.com/larscom/gitlab-ci-dashboard/config"
	"github.com/larscom/gitlab-ci-dashboard/model"
	"github.com/larscom/go-cache"
)

type cacheConfig struct {
	pipelineLatestLoader cache.ICache[model.PipelineKey, *model.Pipeline]
	projectLoader        cache.ICache[model.GroupId, []*model.Project]
	branchLoader         cache.ICache[model.ProjectId, []*model.Branch]
	groupCache           cache.ICache[string, []*model.Group]
}

func newCacheConfig(config *config.GitlabConfig, cfg *clientConfig) *cacheConfig {
	return &cacheConfig{
		pipelineLatestLoader: createPipelineLatestLoader(config, cfg),
		projectLoader:        createProjectLoader(config, cfg),
		branchLoader:         createBranchLoader(config, cfg),
		groupCache:           createGroupCache(config),
	}
}

func createGroupCache(config *config.GitlabConfig) cache.ICache[string, []*model.Group] {
	ttl := time.Second * time.Duration(config.GroupCacheTTLSeconds)
	return cache.NewCache(cache.WithExpireAfterWrite[string, []*model.Group](ttl))
}

func createBranchLoader(config *config.GitlabConfig, ctx *clientConfig) cache.ICache[model.ProjectId, []*model.Branch] {
	return cache.NewCache(
		cache.WithExpireAfterWrite[model.ProjectId, []*model.Branch](time.Second*time.Duration(config.BranchCacheTTLSeconds)),
		cache.WithLoader(func(projectId model.ProjectId) ([]*model.Branch, error) {
			return ctx.branchClient.GetBranches(int(projectId)), nil
		}))
}

func createProjectLoader(config *config.GitlabConfig, ctx *clientConfig) cache.ICache[model.GroupId, []*model.Project] {
	return cache.NewCache(
		cache.WithExpireAfterWrite[model.GroupId, []*model.Project](time.Second*time.Duration(config.ProjectCacheTTLSeconds)),
		cache.WithLoader(func(groupId model.GroupId) ([]*model.Project, error) {
			return ctx.projectClient.GetProjects(int(groupId)), nil
		}))
}

func createPipelineLatestLoader(config *config.GitlabConfig, ctx *clientConfig) cache.ICache[model.PipelineKey, *model.Pipeline] {
	return cache.NewCache(
		cache.WithExpireAfterWrite[model.PipelineKey, *model.Pipeline](time.Second*time.Duration(config.PipelineCacheTTLSeconds)),
		cache.WithLoader(func(pipelineKey model.PipelineKey) (*model.Pipeline, error) {
			id, ref := pipelineKey.Parse()
			pipeline, _ := ctx.pipelineClient.GetLatestPipeline(id, ref)
			return pipeline, nil
		}))
}
