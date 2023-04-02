package mock

import "github.com/larscom/gitlab-ci-dashboard/model"

type MockPipelineClient struct{}

func NewMockPipelineClient() *MockPipelineClient {
	return &MockPipelineClient{}
}

func (c *MockPipelineClient) GetLatestPipeline(projectId int, ref string) (*model.Pipeline, error) {
	return nil, nil
}
