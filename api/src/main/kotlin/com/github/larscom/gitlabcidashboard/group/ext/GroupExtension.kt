package com.github.larscom.gitlabcidashboard.group.ext

import com.github.larscom.gitlabcidashboard.group.dto.GroupMetaDto
import org.gitlab4j.api.models.Group

fun Group.toGroupMetaDto(): GroupMetaDto = GroupMetaDto(id = this.id, name = this.name)
fun List<Group>.toGroupMetaDto(): List<GroupMetaDto> = this.map { it.toGroupMetaDto() }