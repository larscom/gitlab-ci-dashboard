package mock

import (
	"slices"

	"github.com/larscom/gitlab-ci-dashboard/model"
)

type JobServiceMock struct {
	Error error
}

func (s *JobServiceMock) GetJobs(projectId int, pipelineId int, scope []string) ([]model.Job, error) {
	jobs := make([]model.Job, 0)

	if projectId == 1 && pipelineId == 2 && slices.Contains(scope, "success") {
		jobs = append(jobs, model.Job{Name: "job-1", Status: "success"})
	}

	if projectId == 1 && pipelineId == 2 && len(scope) == 0 {
		jobs = append(jobs, model.Job{Name: "job-2", Status: "failed"})
	}

	return jobs, s.Error
}
