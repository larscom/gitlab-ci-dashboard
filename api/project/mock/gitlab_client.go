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

func (c *GitlabClientMock) ListGroupProjects(id model.GroupId, options *gitlab.ListGroupProjectsOptions) ([]model.Project, *gitlab.Response, error) {
	if c.Error != nil {
		return make([]model.Project, 0), nil, c.Error
	}

	response := &gitlab.Response{TotalPages: c.TotalPages, NextPage: options.Page + 1}

	if id == 1 && options.Page == 1 && options.PerPage == 100 && !*options.Archived {
		return []model.Project{{Name: "project-1"}, {Name: "project-2"}}, response, nil
	}
	if id == 1 && options.Page == 2 && options.PerPage == 100 && !*options.Archived {
		return []model.Project{{Name: "project-3"}, {Name: "project-4"}}, response, nil
	}

	return make([]model.Project, 0), nil, nil
}
