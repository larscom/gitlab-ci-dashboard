package com.github.larscom.gitlabcidashboard.branch

import com.github.larscom.gitlabcidashboard.branch.model.Branch
import com.github.larscom.gitlabcidashboard.feign.GitlabFeignClient
import com.github.larscom.gitlabcidashboard.feign.extension.toTotalPages
import com.github.larscom.gitlabcidashboard.project.ProjectClient
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
class BranchClient(private val gitlabClient: GitlabFeignClient) {

    companion object {
        private val LOG = LoggerFactory.getLogger(ProjectClient::class.java)
    }

    @Timed(value = "client.get.branches", description = "Time taken to return all branches")
    fun getBranches(projectId: Long): List<Branch> = runBlocking(IO) {
        val totalPages = gitlabClient.getBranchesHead(projectId = projectId)
            .toTotalPages()

        totalPages?.let { getAllBranchesByPage(projectId = projectId, pages = 1.rangeTo(it).toList()) }
            ?: listOf<Branch>().also { LOG.error("Could not determine total amount of pages. Is token valid?") }
    }

    private suspend fun getAllBranchesByPage(projectId: Long, pages: List<Int>) = coroutineScope {
        pages.map { async { getBranchesByPage(projectId = projectId, page = it) } }
            .awaitAll()
            .flatten()
    }

    private fun getBranchesByPage(projectId: Long, page: Int): List<Branch> {
        return try {
            gitlabClient.getBranches(projectId = projectId, page = page)
        } catch (e: FeignException) {
            LOG.warn("Could not fetch Branches (projectId=$projectId, page=$page)", e)
            listOf()
        }
    }
}
