package schedule

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

func (c *GitlabClientMock) ListPipelineSchedules(projectId int, options *gitlab.ListPipelineSchedulesOptions) ([]Schedule, *gitlab.Response, error) {
	if c.err != nil {
		return make([]Schedule, 0), nil, c.err
	}

	response := &gitlab.Response{TotalPages: c.TotalPages, NextPage: options.Page + 1}

	if projectId == 1 && options.Page == 1 && options.PerPage == 100 {
		return []Schedule{{Id: 1}, {Id: 2}}, response, nil
	}
	if projectId == 1 && options.Page == 2 && options.PerPage == 100 {
		return []Schedule{{Id: 3}, {Id: 4}}, response, nil
	}

	return make([]Schedule, 0), nil, nil
}
