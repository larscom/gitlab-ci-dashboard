package config

import (
	"fmt"
	"log"
	"os"
	"strconv"
)

type ServerConfig struct {
	CacheTTLSeconds int
	Debug           bool
}

func NewServerConfig() *ServerConfig {
	return &ServerConfig{
		CacheTTLSeconds: getCacheTTLSeconds(),
		Debug:           getDebug(),
	}
}

func getCacheTTLSeconds() int {
	var cacheTTL = 10

	ttlString, found := os.LookupEnv("SERVER_CACHE_TTL_SECONDS")
	if found {
		val, err := strconv.Atoi(ttlString)
		if err != nil {
			log.Panicf("SERVER_CACHE_TTL_SECONDS contains: '%s' which is not an integer", ttlString)
		}
		cacheTTL = val
		fmt.Printf("SERVER_CACHE_TTL_SECONDS=%d\n", cacheTTL)
	}

	return cacheTTL
}

func getDebug() bool {
	var debug = false

	debugString, found := os.LookupEnv("SERVER_DEBUG")
	if found {
		val, err := strconv.ParseBool(debugString)
		if err != nil {
			log.Panicf("SERVER_DEBUG contains: '%s' which is not a boolean", debugString)
		}
		debug = val
		fmt.Printf("SERVER_DEBUG=%v\n", debug)
	}

	return debug
}
