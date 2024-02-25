package mock

import (
	"context"

	"github.com/larscom/gitlab-ci-dashboard/model"
)

type ClientMock struct{}

func (c *ClientMock) GetJobs(projectId int, pipelineId int, scope []string, ctx context.Context) ([]model.Job, error) {
	return []model.Job{{Name: "job-1"}}, nil
}
