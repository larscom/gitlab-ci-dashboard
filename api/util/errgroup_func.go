package util

import "golang.org/x/net/context"

func CreateRunFunc[Arg any, Result any](fn func(Arg) (Result, error), resultchn chan<- Result, ctx context.Context) func(Arg) func() error {
	return func(value Arg) func() error {
		return func() error {
			result, err := fn(value)
			if err != nil {
				return err
			}
			select {
			case resultchn <- result:
				return nil
			case <-ctx.Done():
				return ctx.Err()
			}
		}
	}
}
