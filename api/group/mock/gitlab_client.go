package mock

import (
	"github.com/larscom/gitlab-ci-dashboard/model"
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

func (c *GitlabClientMock) ListGroups(options *gitlab.ListGroupsOptions) ([]model.Group, *gitlab.Response, error) {
	if c.err != nil {
		return make([]model.Group, 0), nil, c.err
	}

	response := &gitlab.Response{TotalPages: c.TotalPages, NextPage: options.Page + 1}

	if len(*options.SkipGroups) > 0 {
		return []model.Group{{Name: "group-10"}, {Name: "group-11"}}, response, nil
	}
	if *options.TopLevelOnly {
		return []model.Group{{Name: "group-20"}, {Name: "group-21"}}, response, nil
	}

	if options.Page == 1 && options.PerPage == 100 {
		return []model.Group{{Name: "group-1"}, {Name: "group-2"}}, response, nil
	}
	if options.Page == 2 && options.PerPage == 100 {
		return []model.Group{{Name: "group-3"}, {Name: "group-4"}}, response, nil
	}

	return make([]model.Group, 0), nil, nil
}

func (c *GitlabClientMock) GetGroup(groupId int, options *gitlab.GetGroupOptions) (*model.Group, *gitlab.Response, error) {
	if groupId == 1 && !*options.WithProjects {
		return &model.Group{Name: "group-1"}, nil, nil
	}
	if groupId == 2 && !*options.WithProjects {
		return &model.Group{Name: "group-2"}, nil, nil
	}
	return nil, nil, nil
}
