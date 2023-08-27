package branch

import (
	"github.com/larscom/gitlab-ci-dashboard/model"
	"github.com/larscom/gitlab-ci-dashboard/pipeline"
	"github.com/larscom/go-cache"
	"sort"
	"sync"
)

type Service interface {
	GetBranchesWithLatestPipeline(projectId int) ([]model.BranchWithPipeline, error)
}

type ServiceImpl struct {
	pipelineLatestLoader cache.Cache[pipeline.Key, *model.Pipeline]
	branchesLoader       cache.Cache[int, []model.Branch]
}

func NewService(
	pipelineLatestLoader cache.Cache[pipeline.Key, *model.Pipeline],
	branchesLoader cache.Cache[int, []model.Branch],
) Service {
	return &ServiceImpl{
		pipelineLatestLoader,
		branchesLoader,
	}
}

func (s *ServiceImpl) GetBranchesWithLatestPipeline(projectId int) ([]model.BranchWithPipeline, error) {
	result := make([]model.BranchWithPipeline, 0)

	branches, err := s.branchesLoader.Get(projectId)
	if err != nil {
		return result, err
	}

	var (
		chn    = make(chan model.BranchWithPipeline, len(branches))
		errchn = make(chan error)
		wg     sync.WaitGroup
	)

	for _, branch := range branches {
		wg.Add(1)
		go s.getLatestPipeline(projectId, &wg, branch, chn, errchn)
	}

	go func() {
		defer close(errchn)
		defer close(chn)
		wg.Wait()
	}()

	if e := <-errchn; e != nil {
		return result, e
	}

	for value := range chn {
		result = append(result, value)
	}

	return sortByUpdatedDate(result), nil
}

func (s *ServiceImpl) getLatestPipeline(
	projectId int,
	wg *sync.WaitGroup,
	branch model.Branch,
	chn chan<- model.BranchWithPipeline,
	errchn chan<- error,
) {
	defer wg.Done()

	pipeline, err := s.pipelineLatestLoader.Get(pipeline.NewPipelineKey(projectId, branch.Name, nil))
	if err != nil {
		errchn <- err
	} else {
		chn <- model.BranchWithPipeline{
			Branch:   branch,
			Pipeline: pipeline,
		}
	}
}

func sortByUpdatedDate(branches []model.BranchWithPipeline) []model.BranchWithPipeline {
	sort.SliceStable(branches[:], func(i, j int) bool {
		pipelineA := branches[i].Pipeline
		pipelineB := branches[j].Pipeline

		if pipelineA == nil {
			return false
		}
		if pipelineB == nil {
			return true
		}

		return pipelineA.UpdatedAt.After(pipelineB.UpdatedAt)
	})

	return branches
}
