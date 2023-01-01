package com.github.larscom.gitlabcidashboard.group.ext

import com.github.larscom.gitlabcidashboard.group.dto.GroupDto
import org.gitlab4j.api.models.Group

fun Group.toGroupDto(): GroupDto = GroupDto(id = this.id)