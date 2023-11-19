package branch

import (
	"sort"

	"github.com/larscom/gitlab-ci-dashboard/model"
	"github.com/larscom/gitlab-ci-dashboard/pipeline"
	"github.com/larscom/gitlab-ci-dashboard/util"
	"github.com/larscom/go-cache"
	"golang.org/x/net/context"
	"golang.org/x/sync/errgroup"
)

type BranchService interface {
	GetBranchesWithLatestPipeline(projectId int) ([]model.BranchWithPipeline, error)
}

type branchService struct {
	pipelineLatestLoader cache.Cacher[pipeline.Key, *model.Pipeline]
	branchesLoader       cache.Cacher[int, []model.Branch]
}

func NewService(
	pipelineLatestLoader cache.Cacher[pipeline.Key, *model.Pipeline],
	branchesLoader cache.Cacher[int, []model.Branch],
) BranchService {
	return &branchService{
		pipelineLatestLoader: pipelineLatestLoader,
		branchesLoader:       branchesLoader,
	}
}

func (s *branchService) GetBranchesWithLatestPipeline(projectId int) ([]model.BranchWithPipeline, error) {
	branches, err := s.branchesLoader.Get(projectId)
	if err != nil {
		return make([]model.BranchWithPipeline, 0), err
	}

	var (
		resultchn = make(chan model.BranchWithPipeline, util.GetMaxChanCapacity(len(branches)))
		g, ctx    = errgroup.WithContext(context.Background())
		results   = make([]model.BranchWithPipeline, 0)
	)

	for _, branch := range branches {
		run := util.CreateRunFunc[branchPipelineArgs, model.BranchWithPipeline](s.getLatestPipeline, resultchn, ctx)
		g.Go(run(branchPipelineArgs{
			projectId: projectId,
			branch:    branch,
		}))
	}

	go func() {
		defer close(resultchn)
		g.Wait()
	}()

	for value := range resultchn {
		results = append(results, value)
	}

	return sortByUpdatedDate(results), g.Wait()
}

type branchPipelineArgs struct {
	projectId int
	branch    model.Branch
}

func (s *branchService) getLatestPipeline(args branchPipelineArgs) (model.BranchWithPipeline, error) {
	pipeline, err := s.pipelineLatestLoader.Get(pipeline.NewPipelineKey(args.projectId, args.branch.Name, nil))
	return model.BranchWithPipeline{
		Branch:   args.branch,
		Pipeline: pipeline,
	}, err
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
