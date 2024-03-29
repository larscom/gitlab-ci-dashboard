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
	ProjectCacheTTLSeconds int

	PipelineCacheTTLSeconds int
	PipelineHistoryDays     int

	BranchCacheTTLSeconds int

	ScheduleCacheTTLSeconds int

	JobCacheTTLSeconds int
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
		ProjectCacheTTLSeconds: getProjectCacheTTLSeconds(),

		PipelineCacheTTLSeconds: getPipelineCacheTTLSeconds(),
		PipelineHistoryDays:     getPipelineHistoryDays(),

		BranchCacheTTLSeconds: getBranchCacheTTLSeconds(),

		ScheduleCacheTTLSeconds: getScheduleCacheTTLSeconds(),

		JobCacheTTLSeconds: getJobCacheTTLSeconds(),
	}
}

func parseInt(lookupEnv string, defaultValue int) int {
	s, found := os.LookupEnv(lookupEnv)
	if !found {
		return defaultValue
	}

	i, err := strconv.Atoi(s)
	if err != nil {
		log.Panicf("%s contains: '%s' which is not an int", lookupEnv, s)
	}

	log.Printf("%s = %d\n", lookupEnv, i)

	return i
}

func parseBool(lookupEnv string, defaultValue bool) bool {
	s, found := os.LookupEnv(lookupEnv)
	if !found {
		return defaultValue
	}

	b, err := strconv.ParseBool(s)
	if err != nil {
		log.Panicf("%s contains: '%v' which is not a bool", lookupEnv, b)
	}

	log.Printf("%s = %v\n", lookupEnv, b)

	return b
}

func parseIntSlice(lookupEnv string, defaultValue []int) []int {
	s, found := os.LookupEnv(lookupEnv)
	if !found {
		return defaultValue
	}

	ints := make([]int, 0)
	strings := strings.Split(s, ",")

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

func getProjectCacheTTLSeconds() int {
	return parseInt("GITLAB_PROJECT_CACHE_TTL_SECONDS", 300)
}

func getPipelineCacheTTLSeconds() int {
	return parseInt("GITLAB_PIPELINE_CACHE_TTL_SECONDS", 10)
}

func getPipelineHistoryDays() int {
	return parseInt("GITLAB_PIPELINE_HISTORY_DAYS", 5)
}

func getBranchCacheTTLSeconds() int {
	return parseInt("GITLAB_BRANCH_CACHE_TTL_SECONDS", 60)
}

func getScheduleCacheTTLSeconds() int {
	return parseInt("GITLAB_SCHEDULE_CACHE_TTL_SECONDS", 300)
}

func getJobCacheTTLSeconds() int {
	return parseInt("GITLAB_JOB_CACHE_TTL_SECONDS", 10)
}
