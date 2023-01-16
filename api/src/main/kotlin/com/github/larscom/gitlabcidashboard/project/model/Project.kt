package com.github.larscom.gitlabcidashboard.project.model

import com.fasterxml.jackson.annotation.JsonAlias

data class Project(
    val id: Long,
    val name: String,
    @JsonAlias("default_branch") val defaultBranch: String,
    val topics: Set<String>
)