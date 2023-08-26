package pipeline

import (
	"fmt"
	"github.com/larscom/gitlab-ci-dashboard/data"
	"sync"
	"time"

	"github.com/larscom/gitlab-ci-dashboard/config"

	"github.com/xanzy/go-gitlab"
)

type Client interface {
	GetLatestPipeline(projectId int, ref string) (*data.Pipeline, error)

	GetLatestPipelineBySource(projectId int, ref string, source string) (*data.Pipeline, error)

	GetPipelines(projectId int) []data.Pipeline
}

type ClientImpl struct {
	client GitlabClient
	config *config.GitlabConfig
}

func NewClient(client GitlabClient, config *config.GitlabConfig) Client {
	return &ClientImpl{
		client,
		config,
	}
}

func (c *ClientImpl) GetLatestPipeline(projectId int, ref string) (*data.Pipeline, error) {
	options := &gitlab.GetLatestPipelineOptions{Ref: &ref}
	pipeline, _, err := c.client.GetLatestPipeline(projectId, options)
	return pipeline, err
}

func (c *ClientImpl) GetLatestPipelineBySource(projectId int, ref string, source string) (*data.Pipeline, error) {
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

func (c *ClientImpl) GetPipelines(projectId int) []data.Pipeline {
	pipelines, response, err := c.client.ListProjectPipelines(projectId, c.createOptions(1))
	if err != nil {
		return pipelines
	}
	if response.NextPage == 0 || response.TotalPages <= 1 {
		return pipelines
	}

	chn := make(chan []data.Pipeline, response.TotalPages)

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

func (c *ClientImpl) getPipelinesByPage(projectId int, wg *sync.WaitGroup, pageNumber int, chn chan<- []data.Pipeline) {
	defer wg.Done()
	pipelines, _, _ := c.client.ListProjectPipelines(projectId, c.createOptions(pageNumber))
	chn <- pipelines
}

func (c *ClientImpl) createOptions(pageNumber int) *gitlab.ListProjectPipelinesOptions {
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
