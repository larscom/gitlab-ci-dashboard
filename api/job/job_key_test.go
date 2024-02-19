package job

import (
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestParse(t *testing.T) {
	key := NewJobKey(100, 200, []string{"failed", "success"})

	projectId, pipelineId, scope := key.Parse()

	assert.Equal(t, "{\"ProjectId\":100,\"PipelineId\":200,\"Scope\":[\"failed\",\"success\"]}", string(key))
	assert.Equal(t, 100, projectId)
	assert.Equal(t, 200, pipelineId)
	assert.Equal(t, []string{"failed", "success"}, scope)
}
