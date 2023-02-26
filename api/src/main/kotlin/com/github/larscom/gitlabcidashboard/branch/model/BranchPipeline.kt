package com.github.larscom.gitlabcidashboard.branch.model

import com.github.larscom.gitlabcidashboard.pipeline.model.Pipeline

data class BranchPipeline(val branch: Branch, val pipeline: Pipeline? = null)
