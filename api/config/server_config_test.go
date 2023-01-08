package config

import (
	"os"
	"testing"

	. "github.com/onsi/gomega"
)

func TestServerConfigDefault(t *testing.T) {
	g := NewGomegaWithT(t)
	config := NewServerConfig()

	g.Expect(config.CacheTTLSeconds).To(Equal(10))
	g.Expect(config.Debug).To(Equal(false))
}

func TestServerConfig(t *testing.T) {
	g := NewGomegaWithT(t)

	os.Setenv("SERVER_CACHE_TTL_SECONDS", "600")
	os.Setenv("SERVER_DEBUG", "true")

	config := NewServerConfig()

	g.Expect(config.CacheTTLSeconds).To(Equal(600))
	g.Expect(config.Debug).To(Equal(true))
}

func TestServerConfigDebugPanic(t *testing.T) {
	g := NewGomegaWithT(t)

	os.Setenv("SERVER_DEBUG", "NOT_A_BOOL")

	g.Expect(func() { NewServerConfig() }).To(Panic())
}

func TestServerConfigCacheTTLPanic(t *testing.T) {
	g := NewGomegaWithT(t)

	os.Setenv("SERVER_CACHE_TTL_SECONDS", "NOT_AN_INT")

	g.Expect(func() { NewServerConfig() }).To(Panic())
}
