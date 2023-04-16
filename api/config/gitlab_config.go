package config

import (
	"log"
	"os"
	"strconv"
	"strings"
)

type GitlabConfig struct {
	GitlabToken string
	GitlabUrl   string

	GroupOnlyIds         []int
	GroupSkipIds         []int
	GroupCacheTTLSeconds int
	GroupOnlyTopLevel    bool

	ProjectSkipIds         []int
	ProjectHideUnknown     bool
	ProjectCacheTTLSeconds int

	PipelineCacheTTLSeconds int

	BranchCacheTTLSeconds int

	ScheduleCacheTTLSeconds int
}

func NewGitlabConfig() *GitlabConfig {
	return &GitlabConfig{
		GitlabUrl:   getUrl(),
		GitlabToken: getToken(),

		GroupOnlyIds:         getOnlyGroupIds(),
		GroupSkipIds:         getSkipGroupIds(),
		GroupCacheTTLSeconds: getGroupCacheTTLSeconds(),
		GroupOnlyTopLevel:    getGroupOnlyTopLevel(),

		ProjectSkipIds:         getProjectSkipIds(),
		ProjectHideUnknown:     getProjectHideUnknown(),
		ProjectCacheTTLSeconds: getProjectCacheTTLSeconds(),

		PipelineCacheTTLSeconds: getPipelineCacheTTLSeconds(),

		BranchCacheTTLSeconds: getBranchCacheTTLSeconds(),

		ScheduleCacheTTLSeconds: getScheduleCacheTTLSeconds(),
	}
}

func parseInt(lookupEnv string, defaultValue int) int {
	intString, found := os.LookupEnv(lookupEnv)
	if !found {
		return defaultValue
	}

	i, err := strconv.Atoi(intString)
	if err != nil {
		log.Panicf("%s contains: '%s' which is not an int", lookupEnv, intString)
	}

	log.Printf("%s = %d\n", lookupEnv, i)

	return i
}

func parseBool(lookupEnv string, defaultValue bool) bool {
	boolString, found := os.LookupEnv(lookupEnv)
	if !found {
		return defaultValue
	}

	b, err := strconv.ParseBool(boolString)

	if err != nil {
		log.Panicf("%s contains: '%v' which is not a bool", lookupEnv, b)
	}

	log.Printf("%s = %v\n", lookupEnv, b)

	return b
}

func parseIntSlice(lookupEnv string, defaultValue []int) []int {
	str, found := os.LookupEnv(lookupEnv)
	if !found {
		return defaultValue
	}

	ints := make([]int, 0)
	strings := strings.Split(str, ",")

	for _, i := range strings {
		val, err := strconv.Atoi(i)
		if err != nil {
			log.Panicf("%s contains: '%s' which is not an int", lookupEnv, i)
		}
		ints = append(ints, val)
	}

	log.Printf("%s = %v\n", lookupEnv, ints)

	return ints
}

func getUrl() string {
	const key = "GITLAB_BASE_URL"

	gitlabUrl, found := os.LookupEnv(key)
	if !found {
		log.Panicf("'%s' is missing", key)
	}

	log.Printf("%s = %s\n", key, gitlabUrl)

	return gitlabUrl
}

func getToken() string {
	const key = "GITLAB_API_TOKEN"

	gitlabToken, found := os.LookupEnv(key)
	if !found {
		log.Panicf("'%s' is missing", key)
	}

	return gitlabToken
}

func getOnlyGroupIds() []int {
	return parseIntSlice("GITLAB_GROUP_ONLY_IDS", make([]int, 0))
}

func getSkipGroupIds() []int {
	return parseIntSlice("GITLAB_GROUP_SKIP_IDS", make([]int, 0))
}

func getGroupCacheTTLSeconds() int {
	return parseInt("GITLAB_GROUP_CACHE_TTL_SECONDS", 300)
}

func getGroupOnlyTopLevel() bool {
	return parseBool("GITLAB_GROUP_ONLY_TOP_LEVEL", false)
}

func getProjectSkipIds() []int {
	return parseIntSlice("GITLAB_PROJECT_SKIP_IDS", make([]int, 0))
}

func getProjectHideUnknown() bool {
	return parseBool("GITLAB_PROJECT_HIDE_UNKNOWN", false)
}

func getProjectCacheTTLSeconds() int {
	return parseInt("GITLAB_PROJECT_CACHE_TTL_SECONDS", 300)
}

func getPipelineCacheTTLSeconds() int {
	return parseInt("GITLAB_PIPELINE_CACHE_TTL_SECONDS", 10)
}

func getBranchCacheTTLSeconds() int {
	return parseInt("GITLAB_BRANCH_CACHE_TTL_SECONDS", 60)
}

func getScheduleCacheTTLSeconds() int {
	return parseInt("GITLAB_SCHEDULE_CACHE_TTL_SECONDS", 300)
}
