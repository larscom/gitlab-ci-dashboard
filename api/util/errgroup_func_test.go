package util

import (
  "context"
  "errors"
  "testing"
  "time"

  "github.com/stretchr/testify/assert"
)

func TestCreateRunFunc(t *testing.T) {
  mockFn := func(input int) (int, error) {
    return input, nil
  }

  resultChan := make(chan int, 1)

  runFunc := CreateRunFunc(mockFn, resultChan, context.Background())

  err := runFunc(5)()
  assert.NoError(t, err)

  assert.Equal(t, 5, <-resultChan)
}

func TestCreateRunFuncError(t *testing.T) {
  mockErr := errors.New("ERROR!")
  mockFn := func(input int) (int, error) {
    return input, mockErr
  }

  runFunc := CreateRunFunc(mockFn, make(chan int), context.Background())

  err := runFunc(5)()
  assert.Equal(t, mockErr, err)
}

func TestCreateRunFuncCancel(t *testing.T) {
  mockFn := func(input int) (int, error) {
    time.Sleep(time.Millisecond * 50)
    return input, nil
  }

  ctx, cancel := context.WithTimeout(context.Background(), time.Millisecond*10)
  defer cancel()

  runFunc := CreateRunFunc(mockFn, make(chan int), ctx)

  err := runFunc(5)()

  assert.Error(t, err)
}
