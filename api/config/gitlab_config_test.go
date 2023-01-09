package config

import (
	"os"
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestGitlabConfigDefaultPanic(t *testing.T) {
	assert.Panics(t, func() { NewGitlabConfig() })
}

func TestGitlabConfigMinimum(t *testing.T) {
	// minimum
	os.Setenv("GITLAB_BASE_URL", "http://gitlab.com")
	os.Setenv("GITLAB_API_TOKEN", "abc123")

	config := NewGitlabConfig()

	assert.Equal(t, "http://gitlab.com", config.GitlabUrl)
	assert.Equal(t, "abc123", config.GitlabToken)
	assert.Equal(t, []int{}, *config.GitlabGroupSkipIds)
	assert.Equal(t, []int{}, *config.GitlabGroupOnlyIds)
	assert.Equal(t, false, config.GitlabGroupOnlyTopLevel)
	assert.Equal(t, false, config.GitlabProjectHideUnknown)
	assert.Equal(t, []int{}, *config.GitlabProjectSkipIds)
}

func TestGitlabConfigMaximum(t *testing.T) {
	// minimum
	os.Setenv("GITLAB_BASE_URL", "http://gitlab.com")
	os.Setenv("GITLAB_API_TOKEN", "abc123")

	os.Setenv("GITLAB_GROUP_SKIP_IDS", "1,2,3")
	os.Setenv("GITLAB_GROUP_ONLY_IDS", "4,5,6")
	os.Setenv("GITLAB_GROUP_ONLY_TOP_LEVEL", "true")
	os.Setenv("GITLAB_PROJECT_HIDE_UNKNOWN", "true")
	os.Setenv("GITLAB_PROJECT_SKIP_IDS", "7,8,9")

	config := NewGitlabConfig()

	assert.Equal(t, "http://gitlab.com", config.GitlabUrl)
	assert.Equal(t, "abc123", config.GitlabToken)
	assert.Equal(t, []int{1, 2, 3}, *config.GitlabGroupSkipIds)
	assert.Equal(t, []int{4, 5, 6}, *config.GitlabGroupOnlyIds)
	assert.Equal(t, true, config.GitlabGroupOnlyTopLevel)
	assert.Equal(t, true, config.GitlabProjectHideUnknown)
	assert.Equal(t, []int{7, 8, 9}, *config.GitlabProjectSkipIds)
}

func TestServerConfigSkipGroupIdsPanic(t *testing.T) {
	// minimum
	os.Setenv("GITLAB_BASE_URL", "http://gitlab.com")
	os.Setenv("GITLAB_API_TOKEN", "abc123")

	os.Setenv("GITLAB_GROUP_SKIP_IDS", "1,NOT_AN_INT")

	assert.Panics(t, func() { NewGitlabConfig() })
}

func TestServerConfigOnlyGroupIdsPanic(t *testing.T) {
	// minimum
	os.Setenv("GITLAB_BASE_URL", "http://gitlab.com")
	os.Setenv("GITLAB_API_TOKEN", "abc123")

	os.Setenv("GITLAB_GROUP_ONLY_IDS", "1,NOT_AN_INT")

	assert.Panics(t, func() { NewGitlabConfig() })
}

func TestServerConfigOnlyTopLevelGroupsPanic(t *testing.T) {
	// minimum
	os.Setenv("GITLAB_BASE_URL", "http://gitlab.com")
	os.Setenv("GITLAB_API_TOKEN", "abc123")

	os.Setenv("GITLAB_GROUP_ONLY_TOP_LEVEL", "NOT_A_BOOL")

	assert.Panics(t, func() { NewGitlabConfig() })
}

func TestServerConfigHideUnknownProjectsPanic(t *testing.T) {
	// minimum
	os.Setenv("GITLAB_BASE_URL", "http://gitlab.com")
	os.Setenv("GITLAB_API_TOKEN", "abc123")

	os.Setenv("GITLAB_PROJECT_HIDE_UNKNOWN", "NOT_A_BOOL")

	assert.Panics(t, func() { NewGitlabConfig() })
}

func TestServerConfigSkipProjectIdsPanic(t *testing.T) {
	// minimum
	os.Setenv("GITLAB_BASE_URL", "http://gitlab.com")
	os.Setenv("GITLAB_API_TOKEN", "abc123")

	os.Setenv("GITLAB_PROJECT_SKIP_IDS", "1,NOT_INT")

	assert.Panics(t, func() { NewGitlabConfig() })
}
