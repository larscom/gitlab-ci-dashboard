package schedule

type ClientMock struct{}

func NewClientMock() *ClientMock {
	return &ClientMock{}
}

func (c *ClientMock) GetPipelineSchedules(projectId int) []Schedule {
	return []Schedule{{Id: 777}}
}
