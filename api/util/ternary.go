package util

func IfOrElse[T any](condition bool, If func() T, Else T) T {
	if condition {
		return If()
	}
	return Else
}
