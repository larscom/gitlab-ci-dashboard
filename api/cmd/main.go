package main

import (
	"fmt"
	"log"
	"os"

	"github.com/joho/godotenv"
	"github.com/larscom/gitlab-ci-dashboard/config"
	"github.com/larscom/gitlab-ci-dashboard/server"
	"github.com/xanzy/go-gitlab"
)

func main() {
	fmt.Printf(":: Gitlab CI Dashboard :: (%s)\n", os.Getenv("VERSION"))
	fmt.Println("Loading environment: .local.env")

	godotenv.Load(".local.env")

	appConfig := config.NewGitlabConfig()
	gitlabClient, err := gitlab.NewClient(appConfig.GitlabToken, gitlab.WithBaseURL(appConfig.GitlabUrl))
	if err != nil {
		log.Panicf("Failed to create gitlabClient: %v", err)
	}

	serverConfig := config.NewServerConfig()
	echo := server.NewServer(gitlabClient, serverConfig, appConfig)

	echo.Logger.Fatal(echo.Start(":8080"))
}
