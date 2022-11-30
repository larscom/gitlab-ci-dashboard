package server

import (
	"log"
	"time"

	cache "github.com/SporkHubr/echo-http-cache"
	"github.com/SporkHubr/echo-http-cache/adapter/memory"
)

var memcached, err = memory.NewAdapter(
	memory.AdapterWithAlgorithm(memory.LRU),
	memory.AdapterWithCapacity(100000),
)

func NewCacheMiddleware(ttl time.Duration) *cache.Client {
	if err != nil {
		log.Fatal(err)
	}

	cacheClient, err := cache.NewClient(
		cache.ClientWithAdapter(memcached),
		cache.ClientWithTTL(ttl),
	)
	if err != nil {
		log.Fatal(err)
	}

	return cacheClient
}
