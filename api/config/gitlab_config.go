package config

import (
	"fmt"
	"log"
	"os"
	"strconv"
	"strings"
)

type GitlabConfig struct {
	GitlabToken string
	GitlabUrl   string

	GitlabGroupSkipIds      *[]int
	GitlabGroupOnlyIds      *[]int
	GitlabGroupOnlyTopLevel bool

	GitlabProjectHideUnknown bool
	GitlabProjectSkipIds     *[]int
}

func NewGitlabConfig() *GitlabConfig {
	gitlabUrl := getBaseUrl()
	gitlabToken := getToken()

	gitlabGroupSkipIds := getSkippedGroupIds()
	gitlabGroupOnlyIds := getOnlyGroupIds()
	gitlabGroupOnlyTopLevel := getOnlyTopLevelGroups()
	gitlabProjectHideUnknown := getHideUnknownProjects()
	gitlabProjectSkipIds := getSkippedProjectIds()

	return &GitlabConfig{
		GitlabUrl:                gitlabUrl,
		GitlabToken:              gitlabToken,
		GitlabGroupSkipIds:       gitlabGroupSkipIds,
		GitlabGroupOnlyIds:       gitlabGroupOnlyIds,
		GitlabGroupOnlyTopLevel:  gitlabGroupOnlyTopLevel,
		GitlabProjectHideUnknown: gitlabProjectHideUnknown,
		GitlabProjectSkipIds:     gitlabProjectSkipIds,
	}
}

func getBaseUrl() string {
	gitlabUrl, found := os.LookupEnv("GITLAB_BASE_URL")
	if !found {
		log.Panicf("'GITLAB_BASE_URL' is required as environment variable")
	}
	return gitlabUrl
}

func getToken() string {
	gitlabToken, found := os.LookupEnv("GITLAB_API_TOKEN")
	if !found {
		log.Panicf("'GITLAB_API_TOKEN' is required as environment variable")
	}
	return gitlabToken
}

func getSkippedGroupIds() *[]int {
	var groupSkipIds = []int{}

	skippedIdsString, found := os.LookupEnv("GITLAB_GROUP_SKIP_IDS")
	if found {
		ids := strings.Split(skippedIdsString, ",")
		for _, id := range ids {
			val, err := strconv.Atoi(id)
			if err != nil {
				log.Panicf("GITLAB_GROUP_SKIP_IDS contains: '%s' which is not an integer", id)
			}
			groupSkipIds = append(groupSkipIds, val)
		}
		fmt.Printf("GITLAB_GROUP_SKIP_IDS=%v\n", groupSkipIds)
	}

	return &groupSkipIds
}

func getOnlyGroupIds() *[]int {
	var onlyIds = []int{}

	onlyIdsString, found := os.LookupEnv("GITLAB_GROUP_ONLY_IDS")
	if found {
		ids := strings.Split(onlyIdsString, ",")
		for _, id := range ids {
			val, err := strconv.Atoi(id)
			if err != nil {
				log.Panicf("GITLAB_GROUP_ONLY_IDS contains: '%s' which is not an integer", id)
			}
			onlyIds = append(onlyIds, val)
		}
		fmt.Printf("GITLAB_GROUP_ONLY_IDS=%v\n", onlyIds)
	}

	return &onlyIds
}

func getOnlyTopLevelGroups() bool {
	var onlyTopLevelGroups = false

	onlyTopLevelString, found := os.LookupEnv("GITLAB_GROUP_ONLY_TOP_LEVEL")
	if found {
		var err error = nil
		onlyTopLevelGroups, err = strconv.ParseBool(onlyTopLevelString)
		if err != nil {
			log.Panicf("GITLAB_GROUP_ONLY_TOP_LEVEL contains: '%s' which is not a boolean", onlyTopLevelString)
		}
		fmt.Printf("GITLAB_GROUP_ONLY_TOP_LEVEL=%t\n", onlyTopLevelGroups)
	}

	return onlyTopLevelGroups
}

func getHideUnknownProjects() bool {
	var hideUnknown = false

	hideUnknownString, found := os.LookupEnv("GITLAB_PROJECT_HIDE_UNKNOWN")
	if found {
		var err error = nil
		hideUnknown, err = strconv.ParseBool(hideUnknownString)
		if err != nil {
			log.Panicf("GITLAB_PROJECT_HIDE_UNKNOWN contains: '%s' which is not a boolean", hideUnknownString)
		}
		fmt.Printf("GITLAB_PROJECT_HIDE_UNKNOWN=%t\n", hideUnknown)
	}

	return hideUnknown
}

func getSkippedProjectIds() *[]int {
	var projectSkipIds = []int{}

	skippedIdsString, found := os.LookupEnv("GITLAB_PROJECT_SKIP_IDS")
	if found {
		ids := strings.Split(skippedIdsString, ",")
		for _, id := range ids {
			val, err := strconv.Atoi(id)
			if err != nil {
				log.Panicf("GITLAB_PROJECT_SKIP_IDS contains: '%s' which is not an integer", id)
			}
			projectSkipIds = append(projectSkipIds, val)
		}
		fmt.Printf("GITLAB_PROJECT_SKIP_IDS=%v\n", projectSkipIds)
	}

	return &projectSkipIds
}
