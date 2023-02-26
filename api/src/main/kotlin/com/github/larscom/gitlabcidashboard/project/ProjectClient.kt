package com.github.larscom.gitlabcidashboard.project

import com.github.larscom.gitlabcidashboard.feign.GitlabFeignClient
import com.github.larscom.gitlabcidashboard.feign.extension.toTotalPages
import com.github.larscom.gitlabcidashboard.project.model.Project
import feign.FeignException
import io.micrometer.core.annotation.Timed
import kotlinx.coroutines.Dispatchers.IO
import kotlinx.coroutines.async
import kotlinx.coroutines.awaitAll
import kotlinx.coroutines.coroutineScope
import kotlinx.coroutines.runBlocking
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Component

@Component
class ProjectClient(private val gitlabClient: GitlabFeignClient) {

    companion object {
        private val LOG = LoggerFactory.getLogger(ProjectClient::class.java)
    }

    @Timed(value = "client.time", description = "Time taken to return all projects for group")
    fun getProjects(groupId: Long): List<Project> = runBlocking(IO) {
        val totalPages = gitlabClient.getProjectsHead(groupId = groupId)
            .toTotalPages()

        totalPages?.let { getAllProjectsByPage(groupId = groupId, pages = 1.rangeTo(it).toList()) }
            ?: listOf<Project>().also { LOG.error("Could not determine total amount of pages. Is token valid?") }
    }

    private suspend fun getAllProjectsByPage(groupId: Long, pages: List<Int>) = coroutineScope {
        pages.map { async { getProjectsByPage(groupId = groupId, page = it) } }
            .awaitAll()
            .flatten()
    }

    private fun getProjectsByPage(groupId: Long, page: Int): List<Project> {
        return try {
            gitlabClient.getProjects(groupId = groupId, page = page)
        } catch (e: FeignException) {
            LOG.warn("Could not fetch Projects (groupId=$groupId, page=$page)", e)
            listOf()
        }
    }
}
