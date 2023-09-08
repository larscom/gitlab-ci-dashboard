package pipeline

import (
	"fmt"
	"github.com/larscom/gitlab-ci-dashboard/model"
	"strconv"
	"strings"
)

type Key string

func (p Key) Parse() (id model.ProjectId, ref string, source *string) {
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
		return model.ProjectId(pid), r, nil
	}

	s := parts[2]
	return model.ProjectId(pid), r, &s
}

func NewPipelineKey(id model.ProjectId, ref string, source *string) Key {
	if source != nil {
		return Key(fmt.Sprintf("%d@%s@%s", id, ref, *source))
	}
	return Key(fmt.Sprintf("%d@%s", id, ref))
}
