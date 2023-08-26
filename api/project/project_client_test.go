package project

import (
	"fmt"

	"testing"

	"github.com/stretchr/testify/assert"
)

func TestGetProjectsWith1Page(t *testing.T) {
	var (
		totalPages = 1
		client     = NewClient(NewGitlabClientMock(totalPages, nil))
	)

	projects := client.GetProjects(1)

	assert.Len(t, projects, 2)
	assert.Equal(t, "project-1", projects[0].Name)
	assert.Equal(t, "project-2", projects[1].Name)
}

func TestGetProjectsWith2Pages(t *testing.T) {
	var (
		totalPages = 2
		client     = NewClient(NewGitlabClientMock(totalPages, nil))
	)

	projects := client.GetProjects(1)

	assert.Len(t, projects, 4)
	assert.Equal(t, "project-1", projects[0].Name)
	assert.Equal(t, "project-2", projects[1].Name)
	assert.Equal(t, "project-3", projects[2].Name)
	assert.Equal(t, "project-4", projects[3].Name)
}

func TestGetProjectsWithErrorEmptySlice(t *testing.T) {
	client := NewClient(NewGitlabClientMock(0, fmt.Errorf("ERROR")))

	projects := client.GetProjects(1)

	assert.Len(t, projects, 0)
}
