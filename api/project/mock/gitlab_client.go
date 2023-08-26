package mock

import (
	"github.com/larscom/gitlab-ci-dashboard/data"
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

func (c *GitlabClientMock) ListGroupProjects(groupId int, options *gitlab.ListGroupProjectsOptions) ([]data.Project, *gitlab.Response, error) {
	if c.err != nil {
		return make([]data.Project, 0), nil, c.err
	}

	response := &gitlab.Response{TotalPages: c.TotalPages, NextPage: options.Page + 1}

	if groupId == 1 && options.Page == 1 && options.PerPage == 100 && !*options.Archived {
		return []data.Project{{Name: "project-1"}, {Name: "project-2"}}, response, nil
	}
	if groupId == 1 && options.Page == 2 && options.PerPage == 100 && !*options.Archived {
		return []data.Project{{Name: "project-3"}, {Name: "project-4"}}, response, nil
	}

	return make([]data.Project, 0), nil, nil
}
