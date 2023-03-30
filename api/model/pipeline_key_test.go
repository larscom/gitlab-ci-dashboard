package model

import (
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestPipelineKey(t *testing.T) {
	key := NewPipelineKey(1, "master")
	projectId, ref := key.Parse()

	assert.Equal(t, "1@master", string(key))
	assert.Equal(t, 1, projectId)
	assert.Equal(t, "master", ref)
}
