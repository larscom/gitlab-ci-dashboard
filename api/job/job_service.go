package job

import (
	"sort"

	"github.com/larscom/gitlab-ci-dashboard/model"
	ldgc "github.com/larscom/go-loading-cache"
)

type JobService interface {
	GetJobs(projectId int, pipelineId int, scope []string) ([]model.Job, error)
}

type jobService struct {
	jobsLoader ldgc.LoadingCache[Key, []model.Job]
}

func NewService(
	jobsLoader ldgc.LoadingCache[Key, []model.Job],
) JobService {
	return &jobService{
		jobsLoader: jobsLoader,
	}
}

func (s *jobService) GetJobs(projectId int, pipelineId int, scope []string) ([]model.Job, error) {
	jobs, err := s.jobsLoader.Load(NewJobKey(projectId, pipelineId, scope))
	if err != nil {
		return make([]model.Job, 0), err
	}
	return sortByCreatedDate(jobs), nil
}

func sortByCreatedDate(jobs []model.Job) []model.Job {
	sort.SliceStable(jobs[:], func(i, j int) bool {
		return jobs[i].CreatedAt.Before(jobs[j].CreatedAt)
	})

	return jobs
}
