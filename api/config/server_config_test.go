package config

import (
	"os"
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestServerConfigDefault(t *testing.T) {
	config := NewServerConfig()

	assert.Equal(t, 10, config.CacheTTLSeconds)
	assert.Equal(t, false, config.Debug)
}

func TestServerConfig(t *testing.T) {
	os.Setenv("SERVER_CACHE_TTL_SECONDS", "600")
	os.Setenv("SERVER_DEBUG", "true")

	config := NewServerConfig()

	assert.Equal(t, 600, config.CacheTTLSeconds)
	assert.Equal(t, true, config.Debug)
}

func TestServerConfigDebugPanic(t *testing.T) {
	os.Setenv("SERVER_DEBUG", "NOT_A_BOOL")

	assert.Panics(t, func() { NewServerConfig() })
}

func TestServerConfigCacheTTLPanic(t *testing.T) {
	os.Setenv("SERVER_CACHE_TTL_SECONDS", "NOT_AN_INT")

	assert.Panics(t, func() { NewServerConfig() })
}
