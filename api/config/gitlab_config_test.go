package config

import (
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestDefaultPanic(t *testing.T) {
	t.Run("GITLAB_BASE_URL", func(t *testing.T) {
		assert.PanicsWithValue(t, "'GITLAB_BASE_URL' is missing", func() { NewGitlabConfig() })
	})
	t.Run("GITLAB_API_TOKEN", func(t *testing.T) {
		t.Setenv("GITLAB_BASE_URL", "http://gitlab.com")

		assert.PanicsWithValue(t, "'GITLAB_API_TOKEN' is missing", func() { NewGitlabConfig() })
	})
}

func TestMinimumWithDefaults(t *testing.T) {
	t.Setenv("GITLAB_BASE_URL", "http://gitlab.com")
	t.Setenv("GITLAB_API_TOKEN", "abc123")

	config := NewGitlabConfig()

	assert.Equal(t, "http://gitlab.com", config.GitlabUrl)
	assert.Equal(t, "abc123", config.GitlabToken)

	assert.Empty(t, config.GroupOnlyIds)
	assert.Empty(t, config.GroupSkipIds)
	assert.Equal(t, 300, config.GroupCacheTTLSeconds)
	assert.False(t, config.GroupOnlyTopLevel)

	assert.Empty(t, config.ProjectSkipIds)
	assert.False(t, config.ProjectHideUnknown)
	assert.Equal(t, 300, config.ProjectCacheTTLSeconds)

	assert.Equal(t, 10, config.PipelineCacheTTLSeconds)
	assert.Equal(t, 60, config.BranchCacheTTLSeconds)
	assert.Equal(t, 300, config.ScheduleCacheTTLSeconds)
}

func TestMaximum(t *testing.T) {
	t.Setenv("GITLAB_BASE_URL", "http://gitlab.com")
	t.Setenv("GITLAB_API_TOKEN", "abc123")

	t.Setenv("GITLAB_GROUP_ONLY_IDS", "1,2,3")
	t.Setenv("GITLAB_GROUP_SKIP_IDS", "4,5,6")
	t.Setenv("GITLAB_GROUP_CACHE_TTL_SECONDS", "65")
	t.Setenv("GITLAB_GROUP_ONLY_TOP_LEVEL", "true")
	t.Setenv("GITLAB_PROJECT_SKIP_IDS", "7,8,9")
	t.Setenv("GITLAB_PROJECT_HIDE_UNKNOWN", "true")
	t.Setenv("GITLAB_PROJECT_CACHE_TTL_SECONDS", "75")
	t.Setenv("GITLAB_PIPELINE_CACHE_TTL_SECONDS", "85")
	t.Setenv("GITLAB_BRANCH_CACHE_TTL_SECONDS", "95")
	t.Setenv("GITLAB_SCHEDULE_CACHE_TTL_SECONDS", "105")

	config := NewGitlabConfig()

	assert.Equal(t, "http://gitlab.com", config.GitlabUrl)
	assert.Equal(t, "abc123", config.GitlabToken)

	assert.Equal(t, []int{1, 2, 3}, config.GroupOnlyIds)
	assert.Equal(t, []int{4, 5, 6}, config.GroupSkipIds)
	assert.Equal(t, 65, config.GroupCacheTTLSeconds)
	assert.True(t, config.GroupOnlyTopLevel)

	assert.Equal(t, []int{7, 8, 9}, config.ProjectSkipIds)
	assert.True(t, config.ProjectHideUnknown)
	assert.Equal(t, 75, config.ProjectCacheTTLSeconds)

	assert.Equal(t, 85, config.PipelineCacheTTLSeconds)
	assert.Equal(t, 95, config.BranchCacheTTLSeconds)
	assert.Equal(t, 105, config.ScheduleCacheTTLSeconds)
}

func TestPanics(t *testing.T) {
	t.Setenv("GITLAB_BASE_URL", "http://gitlab.com")
	t.Setenv("GITLAB_API_TOKEN", "abc123")

	t.Run("GITLAB_GROUP_ONLY_IDS", func(t *testing.T) {
		t.Setenv("GITLAB_GROUP_ONLY_IDS", "1,TT")
		assert.PanicsWithValue(t, "GITLAB_GROUP_ONLY_IDS contains: 'TT' which is not an int", func() { NewGitlabConfig() })
	})
	t.Run("GITLAB_GROUP_SKIP_IDS", func(t *testing.T) {
		t.Setenv("GITLAB_GROUP_SKIP_IDS", "1,TT")
		assert.PanicsWithValue(t, "GITLAB_GROUP_SKIP_IDS contains: 'TT' which is not an int", func() { NewGitlabConfig() })
	})
	t.Run("GITLAB_GROUP_CACHE_TTL_SECONDS", func(t *testing.T) {
		t.Setenv("GITLAB_GROUP_CACHE_TTL_SECONDS", "TT")
		assert.PanicsWithValue(t, "GITLAB_GROUP_CACHE_TTL_SECONDS contains: 'TT' which is not an int", func() { NewGitlabConfig() })
	})
	t.Run("GITLAB_GROUP_ONLY_TOP_LEVEL", func(t *testing.T) {
		t.Setenv("GITLAB_GROUP_ONLY_TOP_LEVEL", "TT")
		assert.PanicsWithValue(t, "GITLAB_GROUP_ONLY_TOP_LEVEL contains: 'false' which is not a bool", func() { NewGitlabConfig() })
	})
	t.Run("GITLAB_PROJECT_SKIP_IDS", func(t *testing.T) {
		t.Setenv("GITLAB_PROJECT_SKIP_IDS", "1,TT")
		assert.PanicsWithValue(t, "GITLAB_PROJECT_SKIP_IDS contains: 'TT' which is not an int", func() { NewGitlabConfig() })
	})
	t.Run("GITLAB_PROJECT_HIDE_UNKNOWN", func(t *testing.T) {
		t.Setenv("GITLAB_PROJECT_HIDE_UNKNOWN", "TT")
		assert.PanicsWithValue(t, "GITLAB_PROJECT_HIDE_UNKNOWN contains: 'false' which is not a bool", func() { NewGitlabConfig() })
	})
	t.Run("GITLAB_PROJECT_CACHE_TTL_SECONDS", func(t *testing.T) {
		t.Setenv("GITLAB_PROJECT_CACHE_TTL_SECONDS", "TT")
		assert.PanicsWithValue(t, "GITLAB_PROJECT_CACHE_TTL_SECONDS contains: 'TT' which is not an int", func() { NewGitlabConfig() })
	})
	t.Run("GITLAB_PIPELINE_CACHE_TTL_SECONDS", func(t *testing.T) {
		t.Setenv("GITLAB_PIPELINE_CACHE_TTL_SECONDS", "TT")
		assert.PanicsWithValue(t, "GITLAB_PIPELINE_CACHE_TTL_SECONDS contains: 'TT' which is not an int", func() { NewGitlabConfig() })
	})
	t.Run("GITLAB_BRANCH_CACHE_TTL_SECONDS", func(t *testing.T) {
		t.Setenv("GITLAB_BRANCH_CACHE_TTL_SECONDS", "TT")
		assert.PanicsWithValue(t, "GITLAB_BRANCH_CACHE_TTL_SECONDS contains: 'TT' which is not an int", func() { NewGitlabConfig() })
	})
	t.Run("GITLAB_SCHEDULE_CACHE_TTL_SECONDS", func(t *testing.T) {
		t.Setenv("GITLAB_SCHEDULE_CACHE_TTL_SECONDS", "TT")
		assert.PanicsWithValue(t, "GITLAB_SCHEDULE_CACHE_TTL_SECONDS contains: 'TT' which is not an int", func() { NewGitlabConfig() })
	})
}
