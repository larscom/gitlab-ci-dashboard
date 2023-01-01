package com.github.larscom.gitlabcidashboard.group

import com.github.larscom.gitlabcidashboard.group.dto.GroupMetaDto
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

@RequestMapping("/api/groups")
@RestController
class GroupController(private val groupService: GroupService) {

    @GetMapping
    fun getGroupsMeta(): List<GroupMetaDto> = groupService.getGroupsMeta()
}