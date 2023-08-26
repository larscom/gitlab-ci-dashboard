package group

type ClientMock struct{}

func NewClientMock() *ClientMock {
	return &ClientMock{}
}

func (c *ClientMock) GetGroupsById(ids []int) []Group {
	return []Group{{Name: "Z"}, {Name: "X"}, {Name: "Y"}}
}

func (c *ClientMock) GetGroups() []Group {
	return []Group{{Name: "C"}, {Name: "A"}, {Name: "B"}}
}
