package com.github.larscom.gitlabcidashboard.group

import com.github.larscom.gitlabcidashboard.group.model.Group
import org.springframework.beans.factory.annotation.Value
import org.springframework.cache.annotation.Cacheable
import org.springframework.stereotype.Service

@Service
class GroupService(
    private val groupClient: GroupClient,
    @Value("\${gitlab.group.only_ids}") private val onlyGroupIds: List<Long>,
    @Value("\${gitlab.group.skip_ids}") private val skipGroupIds: List<Long>,
) {

    @Cacheable("groups")
    fun getGroups(): List<Group> {
        return onlyGroupIds.takeUnless { it.isEmpty() }
            ?.let { groupClient.getGroupsWithId(groupIds = it).let(::sortByName) }
            ?: skipGroupIds.takeUnless { it.isEmpty() }
                ?.let { skipIds -> groupClient.getGroups(skipIds = skipIds).let(::sortByName) }
            ?: groupClient.getGroups().let(::sortByName)
    }

    private fun sortByName(groups: List<Group>): List<Group> {
        return groups.sortedBy { group -> group.name }
    }
}
