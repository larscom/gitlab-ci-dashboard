package pipeline

import (
	"fmt"
	"strconv"
	"strings"
)

type Key string

func (p Key) Parse() (projectId int, ref string, source *string) {
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

func NewPipelineKey(projectId int, ref string, source *string) Key {
	if source != nil {
		return Key(fmt.Sprintf("%d@%s@%s", projectId, ref, *source))
	}
	return Key(fmt.Sprintf("%d@%s", projectId, ref))
}
