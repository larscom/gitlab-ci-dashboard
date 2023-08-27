package branch

import (
  "github.com/larscom/gitlab-ci-dashboard/model"
  "github.com/xanzy/go-gitlab"
  "sync"
)

type Client interface {
  GetBranches(projectId int) ([]model.Branch, error)
}

type ClientImpl struct {
  client GitlabClient
}

func NewClient(client GitlabClient) Client {
  return &ClientImpl{
    client,
  }
}

func (c *ClientImpl) GetBranches(projectId int) ([]model.Branch, error) {
  branches, response, err := c.client.ListBranches(projectId, createOptions(1))
  if err != nil {
    return branches, err
  }
  if response.NextPage == 0 || response.TotalPages <= 1 {
    return branches, nil
  }

  var (
    chn    = make(chan []model.Branch, response.TotalPages)
    errchn = make(chan error)
    wg     sync.WaitGroup
  )

  for page := response.NextPage; page <= response.TotalPages; page++ {
    wg.Add(1)
    go c.getBranchesByPage(projectId, &wg, page, chn, errchn)
  }

  go func() {
    defer close(errchn)
    defer close(chn)
    wg.Wait()
  }()

  if e := <-errchn; e != nil {
    return branches, e
  }

  for value := range chn {
    branches = append(branches, value...)
  }

  return branches, nil
}

func (c *ClientImpl) getBranchesByPage(
  projectId int,
  wg *sync.WaitGroup,
  pageNumber int,
  chn chan<- []model.Branch,
  errchn chan<- error,
) {
  defer wg.Done()

  branches, _, err := c.client.ListBranches(projectId, createOptions(pageNumber))
  if err != nil {
    errchn <- err
  } else {
    chn <- branches
  }
}

func createOptions(pageNumber int) *gitlab.ListBranchesOptions {
  return &gitlab.ListBranchesOptions{
    ListOptions: gitlab.ListOptions{
      Page:    pageNumber,
      PerPage: 100,
    },
  }
}
