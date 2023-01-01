package com.github.larscom.gitlabcidashboard.project

import org.gitlab4j.api.ProjectApi
import org.gitlab4j.api.models.ProjectFilter
import org.springframework.stereotype.Service

@Service
class ProjectService(
    private val projectApi: ProjectApi,
) {

    fun getProjects() {
        projectApi.getProjectsStream(ProjectFilter())
    }
}