package model

import (
	"fmt"
	"strconv"
	"strings"
)

type PipelineKey string

func (p PipelineKey) Parse() (projectId int, ref string, source *string) {
	parts := strings.Split(string(p), "@")

	if len(parts) < 2 || len(parts) > 3 {
		panic("unexpected length")
	}

	pid, err := strconv.Atoi(parts[0])
	if err != nil {
		panic("could not parse " + parts[0])
	}

	r := parts[1]
	if len(parts) == 2 {
		return pid, r, nil
	}

	s := parts[2]
	return pid, r, &s
}

func NewPipelineKey(projectId int, ref string, source *string) PipelineKey {
	if source != nil {
		return PipelineKey(fmt.Sprintf("%d@%s@%s", projectId, ref, *source))
	}
	return PipelineKey(fmt.Sprintf("%d@%s", projectId, ref))
}
