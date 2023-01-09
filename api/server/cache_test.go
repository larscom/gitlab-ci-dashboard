package server

import (
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
)

func TestCacheMiddleware(t *testing.T) {
	assert.NotNil(t, NewCacheMiddleware(time.Hour))
}
