package com.github.larscom.gitlabcidashboard.project.model

import com.github.larscom.gitlabcidashboard.pipeline.model.Pipeline

data class ProjectWithLatestPipeline(val project: Project, val pipeline: Pipeline? = null)
