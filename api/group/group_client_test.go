package group

import (
	"fmt"
	"strings"
	"testing"

	"github.com/larscom/gitlab-ci-dashboard/config"
	"github.com/larscom/gitlab-ci-dashboard/mock"
	"github.com/stretchr/testify/assert"
)

func createConfig(t *testing.T, skipGroupIds []int, topLevelOnly bool) *config.GitlabConfig {
	t.Setenv("GITLAB_BASE_URL", "http://gitlab.fake")
	t.Setenv("GITLAB_API_TOKEN", "abc123")
	t.Setenv("GITLAB_GROUP_ONLY_TOP_LEVEL", fmt.Sprintf("%v", topLevelOnly))

	if len(skipGroupIds) > 0 {
		groupIdsStrings := make([]string, len(skipGroupIds))
		for i, num := range skipGroupIds {
			groupIdsStrings[i] = fmt.Sprintf("%d", num)
		}
		t.Setenv("GITLAB_GROUP_SKIP_IDS", strings.Join(groupIdsStrings, ","))
	}

	return config.NewGitlabConfig()
}

func TestGetGroupsWith1Page(t *testing.T) {
	cfg := createConfig(t, make([]int, 0), false)

	const totalPages = 1
	client := NewGroupClient(mock.NewMockGitlabClient(totalPages, nil), cfg)

	groups := client.GetGroups()

	assert.Len(t, groups, 2)
	assert.Equal(t, "group-1", groups[0].Name)
	assert.Equal(t, "group-2", groups[1].Name)
}

func TestGetGroupsWith2Pages(t *testing.T) {
	cfg := createConfig(t, make([]int, 0), false)

	const totalPages = 2
	client := NewGroupClient(mock.NewMockGitlabClient(totalPages, nil), cfg)

	groups := client.GetGroups()

	assert.Len(t, groups, 4)
	assert.Equal(t, "group-1", groups[0].Name)
	assert.Equal(t, "group-2", groups[1].Name)
	assert.Equal(t, "group-3", groups[2].Name)
	assert.Equal(t, "group-4", groups[3].Name)
}

func TestGetGroupsWithTopLevelOnly(t *testing.T) {
	const topLevelOnly = true
	cfg := createConfig(t, make([]int, 0), topLevelOnly)

	const totalPages = 1
	client := NewGroupClient(mock.NewMockGitlabClient(totalPages, nil), cfg)

	groups := client.GetGroups()

	assert.Len(t, groups, 2)
	assert.Equal(t, "group-20", groups[0].Name)
	assert.Equal(t, "group-21", groups[1].Name)
}

func TestGetGroupsWithSkipIds(t *testing.T) {
	skipIds := []int{1}
	cfg := createConfig(t, skipIds, false)

	const totalPages = 1
	client := NewGroupClient(mock.NewMockGitlabClient(totalPages, nil), cfg)

	groups := client.GetGroups()

	assert.Len(t, groups, 2)
	assert.Equal(t, "group-10", groups[0].Name)
	assert.Equal(t, "group-11", groups[1].Name)
}

func TestGetGroupsWithErrorEmptySlice(t *testing.T) {
	cfg := createConfig(t, make([]int, 0), false)

	client := NewGroupClient(mock.NewMockGitlabClient(1, fmt.Errorf("ERROR")), cfg)

	groups := client.GetGroups()

	assert.Len(t, groups, 0)
}

func TestGetGroupsById(t *testing.T) {
	cfg := createConfig(t, make([]int, 0), false)

	const totalPages = 1
	client := NewGroupClient(mock.NewMockGitlabClient(totalPages, nil), cfg)

	groups := client.GetGroupsById([]int{1, 2})

	assert.Len(t, groups, 2)

	groupNames := []string{groups[0].Name, groups[1].Name}

	assert.ElementsMatch(t, groupNames, []string{"group-1", "group-2"})
}
