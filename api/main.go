package main

import (
  "github.com/xanzy/go-gitlab"
  "log"
  "os"

  "github.com/joho/godotenv"
  "github.com/larscom/gitlab-ci-dashboard/branch"

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
  gc := createGitlabClient(cfg)
  clients := server.NewClients(
    project.NewClient(project.NewGitlabClient(gc)),
    group.NewClient(group.NewGitlabClient(gc), cfg),
    pipeline.NewClient(pipeline.NewGitlabClient(gc), cfg),
    branch.NewClient(branch.NewGitlabClient(gc)),
    schedule.NewClient(schedule.NewGitlabClient(gc)),
  )
  caches := server.NewCaches(cfg, clients)
  bootstrap := server.NewBootstrap(cfg, caches, clients)

  log.Fatal(server.NewServer(bootstrap).Listen(":8080"))
}

func createGitlabClient(cfg *config.GitlabConfig) *gitlab.Client {
  client, err := gitlab.NewClient(cfg.GitlabToken, gitlab.WithBaseURL(cfg.GitlabUrl))
  if err != nil {
    log.Panicf("failed to create gitlab client: %v", err)
  }
  return client
}
