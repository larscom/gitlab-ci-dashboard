package main

import (
	"log"
	"os"

	"github.com/joho/godotenv"
	"github.com/larscom/gitlab-ci-dashboard/branch"
	"github.com/larscom/gitlab-ci-dashboard/config"
	"github.com/larscom/gitlab-ci-dashboard/group"
	"github.com/larscom/gitlab-ci-dashboard/pipeline"
	"github.com/larscom/gitlab-ci-dashboard/project"
	"github.com/larscom/gitlab-ci-dashboard/server"
	"github.com/xanzy/go-gitlab"
)

func main() {
	log.Printf(":: Gitlab CI Dashboard (%s) ::\n", os.Getenv("VERSION"))
	godotenv.Load(".env")

	config := config.NewGitlabConfig()
	client, err := gitlab.NewClient(config.GitlabToken, gitlab.WithBaseURL(config.GitlabUrl))
	if err != nil {
		log.Panicf("failed to create gitlab client: %v", err)
	}
	clients := server.NewClients(
		project.NewProjectClient(client),
		group.NewGroupClient(client, config),
		pipeline.NewPipelineClient(client),
		branch.NewBranchClient(client),
	)
	caches := server.NewCaches(config, clients)
	bootstrap := server.NewBootstrap(config, client, caches, clients)

	server := server.NewServer(bootstrap)

	log.Fatal(server.Listen(":8080"))
}
