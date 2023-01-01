package com.github.larscom.gitlabcidashboard.group

import com.github.larscom.gitlabcidashboard.config.GitlabConfig
import com.github.larscom.gitlabcidashboard.group.dto.GroupDto
import com.github.larscom.gitlabcidashboard.group.ext.toGroupDto
import kotlinx.coroutines.async
import kotlinx.coroutines.awaitAll
import kotlinx.coroutines.coroutineScope
import kotlinx.coroutines.runBlocking
import org.gitlab4j.api.GroupApi
import org.springframework.cache.annotation.Cacheable
import org.springframework.stereotype.Service

@Service
class GroupService(
    private val groupApi: GroupApi,
    private val gitlabConfig: GitlabConfig
) {

    @Cacheable(cacheNames = ["groups"])
    fun getGroups(): List<GroupDto> {
        return gitlabConfig.group.onlyIds.takeUnless { it.isEmpty() }
            ?.let { ids -> runBlocking { getGroupsWithId(ids) } }
            ?: gitlabConfig.group.skipIds.takeUnless { it.isEmpty() }
                ?.let { ids ->
                    groupApi.groups
                        .filter { ids.contains(it.id).not() }
                        .map { it.toGroupDto() }
                }
            ?: groupApi.groups.map { it.toGroupDto() }
    }

    private suspend fun getGroupsWithId(ids: List<Long>) = coroutineScope {
        ids.map { id -> async { groupApi.getGroup(id).toGroupDto() } }.awaitAll()
    }
}