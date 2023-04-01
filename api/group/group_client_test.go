package group

import (
	"fmt"
	"testing"

	"github.com/larscom/gitlab-ci-dashboard/config"
	"github.com/larscom/gitlab-ci-dashboard/mock"
	"github.com/stretchr/testify/assert"
)

func createConfig(t *testing.T, skipGroupIds []int, topLevelOnly bool) *config.GitlabConfig {
	t.Setenv("GITLAB_BASE_URL", "http://gitlab.fake")
	t.Setenv("GITLAB_API_TOKEN", "abc123")

	return config.NewGitlabConfig()
}

func TestGetGroupsWith1Page(t *testing.T) {
	cfg := createConfig(t, make([]int, 0), false)

	const totalPages = 1
	client := NewGroupClient(mock.CreateMockGitlabClient(totalPages, nil), cfg)

	groups := client.GetGroups()

	assert.Len(t, groups, 2)
	assert.Equal(t, "group-1", groups[0].Name)
	assert.Equal(t, "group-2", groups[1].Name)
}

func TestGetGroupsWith2Pages(t *testing.T) {
	cfg := createConfig(t, make([]int, 0), false)

	const totalPages = 2
	client := NewGroupClient(mock.CreateMockGitlabClient(totalPages, nil), cfg)

	groups := client.GetGroups()

	assert.Len(t, groups, 4)
	assert.Equal(t, "group-1", groups[0].Name)
	assert.Equal(t, "group-2", groups[1].Name)
	assert.Equal(t, "group-3", groups[2].Name)
	assert.Equal(t, "group-4", groups[3].Name)
}

func TestGetGroupsWithErrorEmptySlice(t *testing.T) {
	cfg := createConfig(t, make([]int, 0), false)

	client := NewGroupClient(mock.CreateMockGitlabClient(1, fmt.Errorf("ERROR")), cfg)

	groups := client.GetGroups()

	assert.Len(t, groups, 0)
}
