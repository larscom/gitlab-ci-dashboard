package com.github.larscom.gitlabcidashboard.group

import org.gitlab4j.api.models.Group
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

@RequestMapping("/api/groups")
@RestController
class GroupController(private val groupService: GroupService) {

    @GetMapping
    fun getGroups(): List<Group> = groupService.getGroups()
}