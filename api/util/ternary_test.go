package util

import (
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestIfOrElse(t *testing.T) {
	assert.Equal(t, "true", IfOrElse(true, func() string { return "true" }, "false"))
	assert.Equal(t, "false", IfOrElse(false, func() string { return "true" }, "false"))
}
