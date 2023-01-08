package config

import "testing"

func TestDefaultServerConfig(t *testing.T) {
	result := NewServerConfig()
	assert(result.Debug == false)
	assert(result.CacheTTLSeconds == 10)
}

func assert(c bool) {
	if !c {
		panic("assert failed")
	}
}
