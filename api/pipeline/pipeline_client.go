package pipeline

import (
	"fmt"
	"sync"
	"time"

	"github.com/larscom/gitlab-ci-dashboard/client"
	"github.com/larscom/gitlab-ci-dashboard/config"
	"github.com/larscom/gitlab-ci-dashboard/model"
	"github.com/xanzy/go-gitlab"
)

type PipelineClient interface {
	GetLatestPipeline(projectId int, ref string) (*model.Pipeline, error)
	GetLatestPipelineBySource(projectId int, ref string, source string) (*model.Pipeline, error)
	GetPipelines(projectId int) []model.Pipeline
}

type PipelineClientImpl struct {
	client client.GitlabClient
	config *config.GitlabConfig
}

func NewPipelineClient(client client.GitlabClient, config *config.GitlabConfig) PipelineClient {
	return &PipelineClientImpl{
		client,
		config,
	}
}

func (c *PipelineClientImpl) GetLatestPipeline(projectId int, ref string) (*model.Pipeline, error) {
	options := &gitlab.GetLatestPipelineOptions{Ref: &ref}
	pipeline, _, err := c.client.GetLatestPipeline(projectId, options)
	return pipeline, err
}

func (c *PipelineClientImpl) GetLatestPipelineBySource(projectId int, ref string, source string) (*model.Pipeline, error) {
	options := &gitlab.ListProjectPipelinesOptions{
		Ref:    &ref,
		Source: &source,
		ListOptions: gitlab.ListOptions{
			Page:    1,
			PerPage: 1,
		},
	}

	pipelines, _, err := c.client.ListProjectPipelines(projectId, options)
	if err != nil {
		return nil, err
	}

	if len(pipelines) > 0 {
		return &pipelines[0], nil
	}

	return nil, fmt.Errorf("no pipelines found for project: %d and branch: %s", projectId, ref)
}

func (c *PipelineClientImpl) GetPipelines(projectId int) []model.Pipeline {
	pipelines, response, err := c.client.ListProjectPipelines(projectId, c.createOptions(1))
	if err != nil {
		return pipelines
	}
	if response.NextPage == 0 || response.TotalPages <= 1 {
		return pipelines
	}

	chn := make(chan []model.Pipeline, response.TotalPages)

	var wg sync.WaitGroup
	for page := response.NextPage; page <= response.TotalPages; page++ {
		wg.Add(1)
		go c.getPipelinesByPage(projectId, &wg, page, chn)
	}

	go func() {
		defer close(chn)
		wg.Wait()
	}()

	for value := range chn {
		pipelines = append(pipelines, value...)
	}

	return pipelines
}

func (c *PipelineClientImpl) getPipelinesByPage(projectId int, wg *sync.WaitGroup, pageNumber int, chn chan<- []model.Pipeline) {
	defer wg.Done()
	pipelines, _, _ := c.client.ListProjectPipelines(projectId, c.createOptions(pageNumber))
	chn <- pipelines
}

func (c *PipelineClientImpl) createOptions(pageNumber int) *gitlab.ListProjectPipelinesOptions {
	// make it negative
	days := c.config.PipelineHistoryDays * -1

	return &gitlab.ListProjectPipelinesOptions{
		// X days ago until now
		UpdatedAfter: gitlab.Time(time.Now().Add(time.Duration(days) * 24 * time.Hour)),
		ListOptions: gitlab.ListOptions{
			Page:    pageNumber,
			PerPage: 100,
		},
	}
}
