package model

import (
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestParse(t *testing.T) {
	key := NewPipelineKey(1, "master")
	projectId, ref := key.Parse()

	assert.Equal(t, "1@master", string(key))
	assert.Equal(t, 1, projectId)
	assert.Equal(t, "master", ref)
}

func TestParsePanicLength(t *testing.T) {
	key := PipelineKey("master")
	assert.PanicsWithValue(t, "unexpected length", func() { key.Parse() })
}

func TestParsePanicProjectId(t *testing.T) {
	key := PipelineKey("nan@master")
	assert.PanicsWithValue(t, "could not parse", func() { key.Parse() })
}
