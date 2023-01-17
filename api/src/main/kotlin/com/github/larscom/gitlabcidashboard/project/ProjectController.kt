package com.github.larscom.gitlabcidashboard.project

import com.github.larscom.gitlabcidashboard.pipeline.model.Pipeline
import com.github.larscom.gitlabcidashboard.project.model.ProjectWithLatestPipeline
import org.springframework.http.MediaType.APPLICATION_JSON_VALUE
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

@RequestMapping("/api/groups/{groupId}/projects", produces = [APPLICATION_JSON_VALUE])
@RestController
class ProjectController(private val projectService: ProjectService) {

    @GetMapping
    fun getProjectsGroupedByStatus(@PathVariable("groupId") groupId: Long): Map<Pipeline.Status, List<ProjectWithLatestPipeline>> =
        projectService.getProjectsGroupedByStatus(groupId)

}