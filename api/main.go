package main

import (
	"log"
	"log/slog"
	"os"
	"strconv"

	"github.com/xanzy/go-gitlab"

	"github.com/joho/godotenv"
	"github.com/larscom/gitlab-ci-dashboard/branch"
	"github.com/larscom/gitlab-ci-dashboard/job"

	"github.com/larscom/gitlab-ci-dashboard/config"
	"github.com/larscom/gitlab-ci-dashboard/group"
	"github.com/larscom/gitlab-ci-dashboard/pipeline"
	"github.com/larscom/gitlab-ci-dashboard/project"
	"github.com/larscom/gitlab-ci-dashboard/schedule"
	"github.com/larscom/gitlab-ci-dashboard/server"
)

func main() {
	if err := godotenv.Load(".env"); err != nil {
		log.Println(":: Starting without .env file")
	}
	setupLogger()

	log.Printf(":: Gitlab CI Dashboard (%s) ::\n", os.Getenv("VERSION"))

	cfg := config.NewGitlabConfig()
	gc := createGitlabClient(cfg)
	clients := server.NewClients(
		project.NewClient(project.NewGitlabClient(gc)),
		group.NewClient(group.NewGitlabClient(gc), cfg),
		pipeline.NewClient(pipeline.NewGitlabClient(gc), cfg),
		branch.NewClient(branch.NewGitlabClient(gc)),
		schedule.NewClient(schedule.NewGitlabClient(gc)),
		job.NewClient(job.NewGitlabClient(gc)),
	)
	caches := server.NewCaches(cfg, clients)
	bootstrap := server.NewBootstrap(cfg, caches, clients)

	log.Fatal(server.NewServer(bootstrap).Listen(getListenAddr()))
}

func setupLogger() {
	slog.SetDefault(slog.New(slog.NewTextHandler(os.Stdout, &slog.HandlerOptions{
		Level: getLogLevel(),
	})))
}

func getLogLevel() slog.Level {
	if getDebugLoggingEnabled() {
		return slog.LevelDebug
	}
	return slog.LevelInfo
}

func getDebugLoggingEnabled() bool {
	env := "SERVER_DEBUG_MODE"
	str, found := os.LookupEnv("SERVER_DEBUG_MODE")
	if found {
		val, err := strconv.ParseBool(str)
		if err != nil {
			log.Panicf("%s contains: '%s' which is not an int", env, str)
		}
		return val
	}
	return false
}

func getListenAddr() string {
	env := "SERVER_LISTEN_ADDR"
	addr, found := os.LookupEnv(env)

	if !found {
		addr = ":8080"
	}

	log.Printf("%s = %s\n", env, addr)

	return addr
}

func createGitlabClient(cfg *config.GitlabConfig) *gitlab.Client {
	client, err := gitlab.NewClient(cfg.GitlabToken, gitlab.WithBaseURL(cfg.GitlabUrl))
	if err != nil {
		log.Panicf("failed to create gitlab client: %v", err)
	}
	return client
}
