package util

import (
	"context"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
)

func TestCreateRunFunc(t *testing.T) {
	mockFn := func(input int) (int, error) {
		return input * 2, nil
	}

	ctx, cancel := context.WithTimeout(context.Background(), time.Millisecond*10)
	defer cancel()

	resultChan := make(chan int, 1)

	runFunc := CreateRunFunc(mockFn, resultChan, ctx)

	err := runFunc(5)()
	assert.NoError(t, err)

	select {
	case result := <-resultChan:
		assert.Equal(t, 10, result)
	case <-time.After(time.Millisecond * 20):
		assert.Fail(t, "Timed out waiting for result")
	}
}
