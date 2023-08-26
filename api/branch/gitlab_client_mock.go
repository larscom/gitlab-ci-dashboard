package branch

import (
	"github.com/xanzy/go-gitlab"
)

func NewGitlabClientMock(TotalPages int, err error) *GitlabClientMock {
	return &GitlabClientMock{
		TotalPages,
		err,
	}
}

type GitlabClientMock struct {
	TotalPages int
	err        error
}

func (c *GitlabClientMock) ListBranches(projectId int, options *gitlab.ListBranchesOptions) ([]Branch, *gitlab.Response, error) {
	if c.err != nil {
		return make([]Branch, 0), nil, c.err
	}

	response := &gitlab.Response{TotalPages: c.TotalPages, NextPage: options.Page + 1}

	if projectId == 1 && options.Page == 1 && options.PerPage == 100 {
		return []Branch{{Name: "branch-1"}, {Name: "branch-2"}}, response, nil
	}
	if projectId == 1 && options.Page == 2 && options.PerPage == 100 {
		return []Branch{{Name: "branch-3"}, {Name: "branch-4"}}, response, nil
	}

	return make([]Branch, 0), nil, nil
}
