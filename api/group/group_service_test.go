package group

import (
	"fmt"
	"strings"
	"testing"

	"github.com/larscom/gitlab-ci-dashboard/config"
	"github.com/larscom/gitlab-ci-dashboard/mock"
	"github.com/stretchr/testify/assert"
)

func TestGroupServiceWithConfig(t *testing.T) {

	createConfig := func(t *testing.T, onlyGroupIds []int) *config.GitlabConfig {
		t.Setenv("GITLAB_BASE_URL", "http://gitlab.fake")
		t.Setenv("GITLAB_API_TOKEN", "abc123")

		if len(onlyGroupIds) > 0 {
			groupIdsStrings := make([]string, len(onlyGroupIds))
			for i, num := range onlyGroupIds {
				groupIdsStrings[i] = fmt.Sprintf("%d", num)
			}
			t.Setenv("GITLAB_GROUP_ONLY_IDS", strings.Join(groupIdsStrings, ","))
		}

		return config.NewGitlabConfig()
	}

	t.Run("TestGetGroupsSortedByName", func(t *testing.T) {
		service := NewGroupService(createConfig(t, make([]int, 0)), mock.NewMockGroupClient())

		groups := service.GetGroups()

		assert.Len(t, groups, 3)
		assert.Equal(t, "A", groups[0].Name)
		assert.Equal(t, "B", groups[1].Name)
		assert.Equal(t, "C", groups[2].Name)
	})

	t.Run("TestGetGroupsByIdSortedByName", func(t *testing.T) {
		service := NewGroupService(createConfig(t, []int{1}), mock.NewMockGroupClient())

		groups := service.GetGroups()

		assert.Len(t, groups, 3)
		assert.Equal(t, "X", groups[0].Name)
		assert.Equal(t, "Y", groups[1].Name)
		assert.Equal(t, "Z", groups[2].Name)
	})
}
