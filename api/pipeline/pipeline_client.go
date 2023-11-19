package pipeline

import (
	"fmt"
	"time"

	"github.com/larscom/gitlab-ci-dashboard/model"
	"github.com/larscom/gitlab-ci-dashboard/util"
	"golang.org/x/net/context"
	"golang.org/x/sync/errgroup"

	"github.com/larscom/gitlab-ci-dashboard/config"

	"github.com/xanzy/go-gitlab"
)

type PipelineClient interface {
	GetLatestPipeline(projectId int, ref string) (*model.Pipeline, error)

	GetLatestPipelineBySource(projectId int, ref string, source string) (*model.Pipeline, error)

	GetPipelines(projectId int) ([]model.Pipeline, error)
}

type pipelineClient struct {
	gitlab GitlabClient
	config *config.GitlabConfig
}

func NewClient(gitlab GitlabClient, config *config.GitlabConfig) PipelineClient {
	return &pipelineClient{
		gitlab: gitlab,
		config: config,
	}
}

func (c *pipelineClient) GetLatestPipeline(projectId int, ref string) (*model.Pipeline, error) {
	options := &gitlab.GetLatestPipelineOptions{Ref: &ref}
	pipeline, _, err := c.gitlab.GetLatestPipeline(projectId, options)
	return pipeline, err
}

func (c *pipelineClient) GetLatestPipelineBySource(projectId int, ref string, source string) (*model.Pipeline, error) {
	options := &gitlab.ListProjectPipelinesOptions{
		Ref:    &ref,
		Source: &source,
		ListOptions: gitlab.ListOptions{
			Page:    1,
			PerPage: 1,
		},
	}

	pipelines, _, err := c.gitlab.ListProjectPipelines(projectId, options)
	if err != nil {
		return nil, err
	}

	if len(pipelines) > 0 {
		return &pipelines[0], nil
	}

	return nil, fmt.Errorf("no pipelines found for project: %d and branch: %s", projectId, ref)
}

func (c *pipelineClient) GetPipelines(projectId int) ([]model.Pipeline, error) {
	pipelines, response, err := c.gitlab.ListProjectPipelines(projectId, c.createOptions(1))
	if err != nil {
		return pipelines, err
	}
	if response.NextPage == 0 || response.TotalPages <= 1 {
		return pipelines, nil
	}

	var (
		resultchn = make(chan []model.Pipeline, util.GetMaxChanCapacity(response.TotalPages))
		g, ctx    = errgroup.WithContext(context.Background())
	)

	for page := response.NextPage; page <= response.TotalPages; page++ {
		run := util.CreateRunFunc[pipelinePageArgs, []model.Pipeline](c.getPipelinesByPage, resultchn, ctx)
		g.Go(run(pipelinePageArgs{
			projectId:  projectId,
			pageNumber: page,
		}))
	}

	go func() {
		defer close(resultchn)
		g.Wait()
	}()

	for value := range resultchn {
		pipelines = append(pipelines, value...)
	}

	return pipelines, g.Wait()
}

type pipelinePageArgs struct {
	projectId  int
	pageNumber int
}

func (c *pipelineClient) getPipelinesByPage(args pipelinePageArgs) ([]model.Pipeline, error) {
	pipelines, _, err := c.gitlab.ListProjectPipelines(args.projectId, c.createOptions(args.pageNumber))
	return pipelines, err
}

func (c *pipelineClient) createOptions(pageNumber int) *gitlab.ListProjectPipelinesOptions {
	minusDays := c.config.PipelineHistoryDays * -1

	return &gitlab.ListProjectPipelinesOptions{
		// X days ago until now
		UpdatedAfter: gitlab.Time(time.Now().Add(time.Duration(minusDays) * 24 * time.Hour)),
		ListOptions: gitlab.ListOptions{
			Page:    pageNumber,
			PerPage: 100,
		},
	}
}
