package test

import (
	"os"

	"github.com/goccy/go-json"
)

func NewStruct[Target any](fileName string, t Target) (Target, error) {
	bytes, err := os.ReadFile(fileName)
	if err != nil {
		return t, err
	}
	err = json.Unmarshal(bytes, &t)

	if err != nil {
		return t, err
	}

	return t, nil
}
