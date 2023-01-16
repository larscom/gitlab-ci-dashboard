package com.github.larscom.gitlabcidashboard.group

import com.github.larscom.gitlabcidashboard.group.model.Group
import org.springframework.beans.factory.annotation.Value
import org.springframework.stereotype.Service

@Service
class GroupService(
    private val groupClient: GroupClient,
    @Value("\${gitlab.group.only_ids}") private val onlyGroupIds: List<Long>,
    @Value("\${gitlab.group.skip_ids}") private val skipGroupIds: List<Long>,
) {

    fun getGroups(): List<Group> {
        return onlyGroupIds.takeUnless { it.isEmpty() }
            ?.let { groupClient.getGroupsWithId(groupIds = it) }
            ?: skipGroupIds.takeUnless { it.isEmpty() }
                ?.let { skipIds -> groupClient.getGroups(skipIds = skipIds) }
            ?: groupClient.getGroups()
    }
}