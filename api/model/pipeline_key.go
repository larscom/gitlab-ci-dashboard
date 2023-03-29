package model

import (
	"fmt"
	"strconv"
	"strings"
)

type PipelineKey string

func (p PipelineKey) Parse() (int, string) {
	parts := strings.Split(string(p), "@")

	if len(parts) != 2 {
		panic("unexpected length")
	}

	projectId, err := strconv.Atoi(parts[0])
	if err != nil {
		panic("could not parse")
	}
	ref := parts[1]

	return projectId, ref
}

func NewPipelineKey(projectId int, ref string) PipelineKey {
	return PipelineKey(fmt.Sprintf("%d@%s", projectId, ref))
}
