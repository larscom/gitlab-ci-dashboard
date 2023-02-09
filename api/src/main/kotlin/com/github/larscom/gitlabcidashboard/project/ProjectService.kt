package com.github.larscom.gitlabcidashboard.project

import com.github.larscom.gitlabcidashboard.pipeline.PipelineKey
import com.github.larscom.gitlabcidashboard.pipeline.PipelineLatestRepository
import com.github.larscom.gitlabcidashboard.pipeline.model.Pipeline
import com.github.larscom.gitlabcidashboard.pipeline.model.Pipeline.Status.UNKNOWN
import com.github.larscom.gitlabcidashboard.project.model.Project
import com.github.larscom.gitlabcidashboard.project.model.ProjectWithLatestPipeline
import kotlinx.coroutines.Dispatchers.IO
import kotlinx.coroutines.async
import kotlinx.coroutines.awaitAll
import kotlinx.coroutines.coroutineScope
import kotlinx.coroutines.runBlocking
import org.springframework.beans.factory.annotation.Value
import org.springframework.stereotype.Service

@Service
class ProjectService(
    @Value("\${gitlab.project.hide_unknown}") private val hideUnknownProjects: Boolean,
    @Value("\${gitlab.project.skip_ids}") private val skipProjectIds: List<Long>,
    private val projectRepository: ProjectRepository,
    private val pipelineLatestRepository: PipelineLatestRepository,
) {

    fun getProjectsGroupedByStatus(groupId: Long): Map<Pipeline.Status, List<ProjectWithLatestPipeline>> =
        runBlocking(IO) {
            val projects = projectRepository.get(groupId)
                .filter { skipProjectIds.isEmpty() || skipProjectIds.contains(it.id).not() }

            val pipelines = getLatestPipelines(projects)
            projects.map { project -> toStatusMap(project, pipelines[project.id]) }
                .asSequence()
                .flatMap { it.asSequence() }
                .groupBy({ it.key }, { it.value })
        }

    private fun toStatusMap(project: Project, pipeline: Pipeline?): Map<Pipeline.Status, ProjectWithLatestPipeline> {
        return pipeline?.let {
            mapOf(it.status to ProjectWithLatestPipeline(project = project, pipeline = it))
        } ?: if (hideUnknownProjects) mapOf() else mapOf(UNKNOWN to ProjectWithLatestPipeline(project = project))
    }

    private suspend fun getLatestPipelines(projects: List<Project>) = coroutineScope {
        projects.map {
            async {
                mapOf(
                    it.id to pipelineLatestRepository.get(
                        PipelineKey(
                            projectId = it.id,
                            ref = it.defaultBranch
                        )
                    )
                )
            }
        }
            .awaitAll()
            .flatMap { it.asSequence() }
            .associate { it.key to it.value }
    }
}