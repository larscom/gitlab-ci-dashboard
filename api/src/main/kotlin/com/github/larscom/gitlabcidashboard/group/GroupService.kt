package com.github.larscom.gitlabcidashboard.group

import com.github.larscom.gitlabcidashboard.config.GitlabConfig
import kotlinx.coroutines.async
import kotlinx.coroutines.awaitAll
import kotlinx.coroutines.coroutineScope
import kotlinx.coroutines.runBlocking
import org.gitlab4j.api.GroupApi
import org.gitlab4j.api.models.Group
import org.springframework.stereotype.Service

@Service
class GroupService(
    private val groupApi: GroupApi,
    private val gitlabConfig: GitlabConfig
) {

    fun getGroups(): List<Group> {
        return gitlabConfig.group.onlyIds.takeUnless { it.isEmpty() }
            ?.let { runBlocking { getGroupsWithId(it) } }
            ?: groupApi.groups
    }

    suspend fun getGroupsWithId(ids: List<Long>) = coroutineScope {
        ids.map { id -> async { groupApi.getGroup(id) } }.awaitAll()
    }
}