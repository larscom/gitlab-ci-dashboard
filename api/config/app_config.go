package config

import (
	"fmt"
	"log"
	"os"
	"strconv"
	"strings"
)

type AppConfig struct {
	GitlabToken             string
	GitlabUrl               string
	GitlabGroupSkipIds      []int
	GitlabGroupOnlyIds      []int
	GitlabGroupOnlyTopLevel bool
}

func NewAppConfig() *AppConfig {
	gitlabUrl := getBaseUrl()
	gitlabToken := getToken()
	gitlabGroupSkipIds := getSkippedGroupIds()
	gitlabGroupOnlyIds := getOnlyGroupIds()
	gitlabGroupOnlyTopLevel := getOnlyTopLevelGroups()

	return &AppConfig{
		GitlabUrl:               gitlabUrl,
		GitlabToken:             gitlabToken,
		GitlabGroupSkipIds:      *gitlabGroupSkipIds,
		GitlabGroupOnlyIds:      *gitlabGroupOnlyIds,
		GitlabGroupOnlyTopLevel: gitlabGroupOnlyTopLevel,
	}
}

func getBaseUrl() string {
	gitlabUrl, found := os.LookupEnv("GITLAB_BASE_URL")
	if !found {
		log.Fatal("'GITLAB_BASE_URL' is required as environment variable")
	}
	return gitlabUrl
}

func getToken() string {
	gitlabToken, found := os.LookupEnv("GITLAB_API_TOKEN")
	if !found {
		log.Fatal("'GITLAB_API_TOKEN' is required as environment variable")
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
				log.Fatalf("GITLAB_GROUP_SKIP_IDS contains: '%s' which is not an integer", id)
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
				log.Fatalf("GITLAB_GROUP_ONLY_IDS contains: '%s' which is not an integer", id)
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
			log.Fatal("'GITLAB_GROUP_ONLY_TOP_LEVEL' should be of type: boolean")
		}
		fmt.Printf("GITLAB_GROUP_ONLY_TOP_LEVEL=%t\n", onlyTopLevelGroups)
	}

	return onlyTopLevelGroups
}
