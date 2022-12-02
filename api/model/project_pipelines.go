package model

import "github.com/xanzy/go-gitlab"

type ProjectWithPipelines struct {
	Project   *gitlab.Project        `json:"project"`
	Pipelines []*gitlab.PipelineInfo `json:"pipelines"`
}
