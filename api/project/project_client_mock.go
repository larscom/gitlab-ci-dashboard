package project

type ClientMock struct{}

func NewClientMock() *ClientMock {
	return &ClientMock{}
}

func (c *ClientMock) GetProjects(groupId int) []Project {
	return []Project{{Name: "project-1"}}
}
