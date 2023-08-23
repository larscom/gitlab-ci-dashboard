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

func TestConvert(t *testing.T) {
	var (
		source = &A{
			ID:     1,
			Name:   "Test",
			Locked: true,
		}
		target = &B{}
	)

	result, err := Convert(source, target)

	assert.NoError(t, err)
	assert.Equal(t, 1, result.Id)
	assert.Equal(t, "Test", result.MyName)
	assert.Equal(t, true, result.IsLocked)
}

func TestConvertMarshalError(t *testing.T) {
	_, err := Convert(func() {}, &B{})

	assert.Error(t, err)
	assert.Contains(t, err.Error(), "unsupported type")
}

func TestConvertUnMarshalError(t *testing.T) {
	_, err := Convert(&A{}, func() {})

	assert.Error(t, err)
	assert.Contains(t, err.Error(), "cannot unmarshal")
}
