package com.github.larscom.gitlabcidashboard.group

import org.gitlab4j.api.GroupApi
import org.gitlab4j.api.models.Group
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

@RequestMapping("/api/groups")
@RestController
class GroupController(private val groupApi: GroupApi) {

    @GetMapping
    fun getGroups(): List<Group> = groupApi.groups
}