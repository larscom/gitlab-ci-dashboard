package util

import (
	"github.com/goccy/go-json"
)

func Convert[Source any, Target any](s Source, t Target) (Target, error) {
	bytes, err := json.Marshal(s)
	if err != nil {
		return t, err
	}
	err = json.Unmarshal(bytes, &t)
	if err != nil {
		return t, err
	}
	return t, nil
}
