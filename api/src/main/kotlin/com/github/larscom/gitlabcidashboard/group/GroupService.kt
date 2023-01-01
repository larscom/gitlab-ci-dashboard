package com.github.larscom.gitlabcidashboard.group

import com.github.larscom.gitlabcidashboard.config.GitlabConfig
import com.github.larscom.gitlabcidashboard.group.dto.GroupMetaDto
import com.github.larscom.gitlabcidashboard.group.ext.toGroupMetaDto
import org.gitlab4j.api.GroupApi
import org.springframework.stereotype.Service

@Service
class GroupService(
    private val groupApi: GroupApi,
    private val gitlabConfig: GitlabConfig
) {

    fun getGroupsMeta(): List<GroupMetaDto> {
        return gitlabConfig.group.onlyIds.takeUnless { it.isEmpty() }
            ?.let { ids -> groupApi.groups.filter { ids.contains(it.id) }.toGroupMetaDto() }
            ?: gitlabConfig.group.skipIds.takeUnless { it.isEmpty() }
                ?.let { ids -> groupApi.groups.filter { ids.contains(it.id).not() }.toGroupMetaDto() }
            ?: groupApi.groups.toGroupMetaDto()
    }
}