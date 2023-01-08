package config

import (
	"os"
	"testing"

	. "github.com/onsi/gomega"
)

func TestGitlabConfigDefaultPanic(t *testing.T) {
	g := NewGomegaWithT(t)
	g.Expect(func() { NewGitlabConfig() }).To(Panic())
}

func TestGitlabConfigMinimum(t *testing.T) {
	g := NewGomegaWithT(t)

	// minimum
	os.Setenv("GITLAB_BASE_URL", "http://gitlab.com")
	os.Setenv("GITLAB_API_TOKEN", "abc123")

	config := NewGitlabConfig()

	g.Expect(config.GitlabUrl).To(Equal("http://gitlab.com"))
	g.Expect(config.GitlabToken).To(Equal("abc123"))
	g.Expect(*config.GitlabGroupSkipIds).To(Equal([]int{}))
	g.Expect(*config.GitlabGroupOnlyIds).To(Equal([]int{}))
	g.Expect(config.GitlabGroupOnlyTopLevel).To(Equal(false))
	g.Expect(config.GitlabProjectHideUnknown).To(Equal(false))
	g.Expect(*config.GitlabProjectSkipIds).To(Equal([]int{}))
}

func TestGitlabConfigMaximum(t *testing.T) {
	g := NewGomegaWithT(t)

	os.Setenv("GITLAB_BASE_URL", "http://gitlab.com")
	os.Setenv("GITLAB_API_TOKEN", "abc123")
	os.Setenv("GITLAB_GROUP_SKIP_IDS", "1,2,3")
	os.Setenv("GITLAB_GROUP_ONLY_IDS", "4,5,6")
	os.Setenv("GITLAB_GROUP_ONLY_TOP_LEVEL", "true")
	os.Setenv("GITLAB_PROJECT_HIDE_UNKNOWN", "true")
	os.Setenv("GITLAB_PROJECT_SKIP_IDS", "7,8,9")

	config := NewGitlabConfig()

	g.Expect(config.GitlabUrl).To(Equal("http://gitlab.com"))
	g.Expect(config.GitlabToken).To(Equal("abc123"))
	g.Expect(*config.GitlabGroupSkipIds).To(Equal([]int{1, 2, 3}))
	g.Expect(*config.GitlabGroupOnlyIds).To(Equal([]int{4, 5, 6}))
	g.Expect(config.GitlabGroupOnlyTopLevel).To(Equal(true))
	g.Expect(config.GitlabProjectHideUnknown).To(Equal(true))
	g.Expect(*config.GitlabProjectSkipIds).To(Equal([]int{7, 8, 9}))
}

func TestServerConfigSkipGroupIdsPanic(t *testing.T) {
	g := NewGomegaWithT(t)

	// minimum
	os.Setenv("GITLAB_BASE_URL", "http://gitlab.com")
	os.Setenv("GITLAB_API_TOKEN", "abc123")

	os.Setenv("GITLAB_GROUP_SKIP_IDS", "1,NOT_INT")

	g.Expect(func() { NewGitlabConfig() }).To(Panic())
}

func TestServerConfigOnlyGroupIdsPanic(t *testing.T) {
	g := NewGomegaWithT(t)

	// minimum
	os.Setenv("GITLAB_BASE_URL", "http://gitlab.com")
	os.Setenv("GITLAB_API_TOKEN", "abc123")

	os.Setenv("GITLAB_GROUP_ONLY_IDS", "1,NOT_INT")

	g.Expect(func() { NewGitlabConfig() }).To(Panic())
}

func TestServerConfigOnlyTopLevelGroupsPanic(t *testing.T) {
	g := NewGomegaWithT(t)

	// minimum
	os.Setenv("GITLAB_BASE_URL", "http://gitlab.com")
	os.Setenv("GITLAB_API_TOKEN", "abc123")

	os.Setenv("GITLAB_GROUP_ONLY_TOP_LEVEL", "NOT_A_BOOL")

	g.Expect(func() { NewGitlabConfig() }).To(Panic())
}

func TestServerConfigHideUnknownProjectsPanic(t *testing.T) {
	g := NewGomegaWithT(t)

	// minimum
	os.Setenv("GITLAB_BASE_URL", "http://gitlab.com")
	os.Setenv("GITLAB_API_TOKEN", "abc123")

	os.Setenv("GITLAB_PROJECT_HIDE_UNKNOWN", "NOT_A_BOOL")

	g.Expect(func() { NewGitlabConfig() }).To(Panic())
}

func TestServerConfigSkipProjectIdsPanic(t *testing.T) {
	g := NewGomegaWithT(t)

	// minimum
	os.Setenv("GITLAB_BASE_URL", "http://gitlab.com")
	os.Setenv("GITLAB_API_TOKEN", "abc123")

	os.Setenv("GITLAB_PROJECT_SKIP_IDS", "1,NOT_INT")

	g.Expect(func() { NewGitlabConfig() }).To(Panic())
}
