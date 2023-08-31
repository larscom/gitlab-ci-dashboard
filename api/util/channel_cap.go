package util

const maxCap = 75

func GetMaxChanCapacity(preferredCap int) int {
	if preferredCap > maxCap {
		return maxCap
	}
	return preferredCap
}
