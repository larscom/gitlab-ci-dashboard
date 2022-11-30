package main

import (
	"fmt"
	"log"

	"github.com/joho/godotenv"
	"github.com/larscom/gitlab-ci-dashboard/config"
	"github.com/larscom/gitlab-ci-dashboard/server"
	"github.com/xanzy/go-gitlab"
)

func main() {
	fmt.Println("Loading environment: .local.env")
	godotenv.Load(".local.env")

	appConfig := config.NewAppConfig()
	gitlabClient, err := gitlab.NewClient(appConfig.GitlabToken, gitlab.WithBaseURL(appConfig.GitlabUrl))
	if err != nil {
		log.Fatalf("Failed to create gitlabClient: %v", err)
	}
	echo := server.NewServer(gitlabClient, appConfig)

	echo.Logger.Fatal(echo.Start(":8080"))
}
