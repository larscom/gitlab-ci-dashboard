package job

import (
	"github.com/goccy/go-json"
)

type Key string

type keyData struct {
	ProjectId  int
	PipelineId int
	Scope      []string
}

func (k Key) Parse() (projectId int, pipelineId int, scope []string) {
	var data keyData
	if err := json.Unmarshal([]byte(k), &data); err != nil {
		panic(err)
	}

	return data.ProjectId, data.PipelineId, data.Scope
}

func NewJobKey(projectId int, pipelineId int, scope []string) Key {
	bytes, err := json.Marshal(keyData{
		ProjectId:  projectId,
		PipelineId: pipelineId,
		Scope:      scope,
	})
	if err != nil {
		panic(err)
	}

	return Key(bytes)
}
