package main

import (
	"log"
	"os"

	"github.com/joho/godotenv"
	"github.com/larscom/gitlab-ci-dashboard/server"
)

func main() {
	log.Printf(":: Gitlab CI Dashboard (%s) ::\n", os.Getenv("VERSION"))
	godotenv.Load(".env")
	server := server.NewServer()
	log.Fatal(server.Listen(":8080"))
}
