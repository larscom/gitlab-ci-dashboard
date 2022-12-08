package model

import "github.com/xanzy/go-gitlab"

type ProjectWithLatestPipeline struct {
	Project  *gitlab.Project      `json:"project"`
	Pipeline *gitlab.PipelineInfo `json:"pipeline"`
}
