package mock

import (
	"github.com/larscom/gitlab-ci-dashboard/model"
	"github.com/xanzy/go-gitlab"
)

func NewGitlabClientMock(totalPages int, err error) *GitlabClientMock {
	return &GitlabClientMock{
		TotalPages: totalPages,
		Error:      err,
	}
}

type GitlabClientMock struct {
	TotalPages int
	Error      error
}

func (c *GitlabClientMock) ListBranches(projectId int, options *gitlab.ListBranchesOptions) ([]model.Branch, *gitlab.Response, error) {
	if c.Error != nil {
		return make([]model.Branch, 0), nil, c.Error
	}

	response := &gitlab.Response{TotalPages: c.TotalPages, NextPage: options.Page + 1}

	if projectId == 1 && options.Page == 1 && options.PerPage == 100 {
		return []model.Branch{{Name: "branch-1"}, {Name: "branch-2"}}, response, nil
	}
	if projectId == 1 && options.Page == 2 && options.PerPage == 100 {
		return []model.Branch{{Name: "branch-3"}, {Name: "branch-4"}}, response, nil
	}

	return make([]model.Branch, 0), nil, nil
}
