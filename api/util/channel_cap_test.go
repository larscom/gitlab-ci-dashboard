package util

import (
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestMaxCap(t *testing.T) {
	assert.Equal(t, 75, GetMaxChanCapacity(76))
	assert.Equal(t, 75, GetMaxChanCapacity(75))
}

func TestPreferredCap(t *testing.T) {
	assert.Equal(t, 74, GetMaxChanCapacity(74))
}
