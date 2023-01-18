package com.github.larscom.gitlabcidashboard.group

import com.github.larscom.gitlabcidashboard.feign.GitlabFeignClient
import com.github.larscom.gitlabcidashboard.feign.extension.toTotalPages
import com.github.larscom.gitlabcidashboard.group.model.Group
import feign.FeignException
import kotlinx.coroutines.Dispatchers.IO
import kotlinx.coroutines.async
import kotlinx.coroutines.awaitAll
import kotlinx.coroutines.coroutineScope
import kotlinx.coroutines.runBlocking
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Component

@Component
class GroupClient(private val gitlabClient: GitlabFeignClient) {

    companion object {
        private val LOG = LoggerFactory.getLogger(GroupClient::class.java)
    }

    fun getGroupsWithId(groupIds: List<Long>): List<Group> = runBlocking(IO) { getAllGroupsById(groupIds) }

    fun getGroups(skipIds: List<Long> = listOf()): List<Group> = runBlocking(IO) {
        val skipGroups = skipIds.takeUnless { it.isEmpty() }?.joinToString(",")
        val totalPages = gitlabClient
            .getGroupsHead(skipGroups = skipGroups)
            .toTotalPages()

        totalPages?.let { getAllGroupsByPage(pages = 1.rangeTo(it).toList(), skipGroups = skipGroups) }
            ?: listOf<Group>().also { LOG.warn("Could not determine total amount of pages. Is token valid?") }
    }

    private suspend fun getAllGroupsById(groupIds: List<Long>) = coroutineScope {
        groupIds.map { async { getGroupById(groupId = it) } }
            .awaitAll()
            .filterNotNull()
    }

    private fun getGroupById(groupId: Long): Group? {
        return try {
            gitlabClient.getGroup(groupId = groupId)
        } catch (e: FeignException) {
            LOG.warn("Could not fetch Group (id=$groupId) from Gitlab API", e)
            null
        }
    }

    private suspend fun getAllGroupsByPage(pages: List<Int>, skipGroups: String?) = coroutineScope {
        pages.map { async { getGroupsByPage(page = it, skipGroups = skipGroups) } }
            .awaitAll()
            .flatten()
    }

    private fun getGroupsByPage(page: Int, skipGroups: String?): List<Group> {
        return try {
            gitlabClient.getGroups(skipGroups = skipGroups, page = page)
        } catch (e: FeignException) {
            LOG.warn("Could not fetch Groups (page=$page) from Gitlab API", e)
            listOf()
        }
    }
}