package util

import (
	"testing"

	"github.com/stretchr/testify/assert"
)

type A struct {
	ID     int    `json:"id"`
	Name   string `json:"name"`
	Locked bool   `json:"is_locked"`
}

type B struct {
	Id       int    `json:"id"`
	MyName   string `json:"name"`
	IsLocked bool   `json:"is_locked"`
}

func Test_Convert(t *testing.T) {
	source := &A{
		ID:     1,
		Name:   "Test",
		Locked: true,
	}
	target := &B{}
	result, err := Convert(source, target)
	assert.NoError(t, err)

	assert.Equal(t, 1, result.Id)
	assert.Equal(t, "Test", result.MyName)
	assert.Equal(t, true, result.IsLocked)
}
