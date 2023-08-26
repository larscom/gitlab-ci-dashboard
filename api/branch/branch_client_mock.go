package branch

type ClientMock struct{}

func NewClientMock() *ClientMock {
	return &ClientMock{}
}

func (c *ClientMock) GetBranches(projectId int) []Branch {
	return []Branch{{Name: "branch-1"}}
}
