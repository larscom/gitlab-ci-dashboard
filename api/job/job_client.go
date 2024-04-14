package job

import (
	"github.com/larscom/gitlab-ci-dashboard/model"
	"github.com/larscom/gitlab-ci-dashboard/util"
	"github.com/xanzy/go-gitlab"
	"golang.org/x/net/context"
	"golang.org/x/sync/errgroup"
)

type JobClient interface {
	GetJobs(projectId int, pipelineId int, scope []string, ctx context.Context) ([]model.Job, error)
}

type jobClient struct {
	gitlab GitlabClient
}

func NewClient(gitlab GitlabClient) JobClient {
	return &jobClient{
		gitlab: gitlab,
	}
}

func (c *jobClient) GetJobs(projectId int, pipelineId int, scope []string, ctx context.Context) ([]model.Job, error) {
	jobs, response, err := c.gitlab.ListPipelineJobs(projectId, pipelineId, createOptions(1, scope))
	if err != nil {
		return jobs, err
	}
	if response.NextPage == 0 || response.TotalPages <= 1 {
		return jobs, nil
	}

	var (
		resultchn = make(chan []model.Job, util.GetMaxChanCapacity(response.TotalPages))
		g, gctx   = errgroup.WithContext(ctx)
	)

	for page := response.NextPage; page <= response.TotalPages; page++ {
		run := util.CreateRunFunc(c.getJobsByPage, resultchn, gctx)
		g.Go(run(jobPageArgs{
			projectId:  projectId,
			pipelineId: pipelineId,
			pageNumber: page,
		}))
	}

	go func() {
		defer close(resultchn)
		g.Wait()
	}()

	for value := range resultchn {
		jobs = append(jobs, value...)
	}

	return jobs, g.Wait()
}

type jobPageArgs struct {
	projectId  int
	pipelineId int
	pageNumber int
	scope      []string
}

func (c *jobClient) getJobsByPage(args jobPageArgs) ([]model.Job, error) {
	jobs, _, err := c.gitlab.ListPipelineJobs(args.projectId, args.pipelineId, createOptions(args.pageNumber, args.scope))
	return jobs, err
}

func createOptions(pageNumber int, scope []string) *gitlab.ListJobsOptions {
	return &gitlab.ListJobsOptions{
		ListOptions: gitlab.ListOptions{
			Page:    pageNumber,
			PerPage: 100,
		},
		Scope:          createScope(scope),
		IncludeRetried: gitlab.Ptr(false),
	}
}

func createScope(scope []string) *[]gitlab.BuildStateValue {
	result := make([]gitlab.BuildStateValue, len(scope))

	for i := 0; i < len(scope); i++ {
		result[i] = gitlab.BuildStateValue(scope[i])
	}

	return &result
}
