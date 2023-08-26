package branch

import (
	"github.com/larscom/gitlab-ci-dashboard/config"
	"github.com/larscom/gitlab-ci-dashboard/util"
	"github.com/xanzy/go-gitlab"
	"log"
	"time"
)

type Branch struct {
	Name      string `json:"name"`
	Merged    bool   `json:"merged"`
	Protected bool   `json:"protected"`
	Default   bool   `json:"default"`
	CanPush   bool   `json:"can_push"`
	WebUrl    string `json:"web_url"`
	Commit    Commit `json:"commit"`
}

type Commit struct {
	Id            string    `json:"id"`
	AuthorName    string    `json:"author_name"`
	CommitterName string    `json:"committer_name"`
	CommittedDate time.Time `json:"committed_date"`
	Title         string    `json:"title"`
	Message       string    `json:"message"`
}

type GitlabClient interface {
	ListBranches(projectId int, opts *gitlab.ListBranchesOptions) ([]Branch, *gitlab.Response, error)
}

type GitlabClientImpl struct {
	client *gitlab.Client
}

func NewGitlabClient(config *config.GitlabConfig) GitlabClient {
	client, err := gitlab.NewClient(config.GitlabToken, gitlab.WithBaseURL(config.GitlabUrl))
	if err != nil {
		log.Panicf("failed to create gitlab client: %v", err)
	}

	return &GitlabClientImpl{
		client,
	}
}

func (c *GitlabClientImpl) ListBranches(projectId int, options *gitlab.ListBranchesOptions) ([]Branch, *gitlab.Response, error) {
	branches, response, err := c.client.Branches.ListBranches(projectId, options)
	if err != nil {
		return util.HandleError(make([]Branch, 0), response, err)
	}

	b, err := util.Convert(branches, make([]Branch, 0))
	if err != nil {
		log.Panicf("unexpected JSON: %v", err)
	}

	return b, response, err
}
