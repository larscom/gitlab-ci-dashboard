package main

import (
	"log"
	"os"

	"github.com/joho/godotenv"
	"github.com/larscom/gitlab-ci-dashboard/branch"
	"github.com/larscom/gitlab-ci-dashboard/client"
	"github.com/larscom/gitlab-ci-dashboard/config"
	"github.com/larscom/gitlab-ci-dashboard/group"
	"github.com/larscom/gitlab-ci-dashboard/pipeline"
	"github.com/larscom/gitlab-ci-dashboard/project"
	"github.com/larscom/gitlab-ci-dashboard/schedule"
	"github.com/larscom/gitlab-ci-dashboard/server"
)

func main() {
	log.Printf(":: Gitlab CI Dashboard (%s) ::\n", os.Getenv("VERSION"))

	if err := godotenv.Load(".env"); err != nil {
		log.Println(":: Starting without .env file")
	}

	cfg := config.NewGitlabConfig()
	c := client.NewGitlabClient(cfg)

	clients := server.NewClients(
		project.NewClient(c),
		group.NewClient(c, cfg),
		pipeline.NewClient(c, cfg),
		branch.NewClient(c),
		schedule.NewClient(c),
	)
	caches := server.NewCaches(cfg, clients)
	bootstrap := server.NewBootstrap(cfg, c, caches, clients)

	log.Fatal(server.NewServer(bootstrap).Listen(":8080"))
}
