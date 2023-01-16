package com.github.larscom.gitlabcidashboard.group

import com.github.larscom.gitlabcidashboard.group.model.Group
import org.springframework.http.MediaType.APPLICATION_JSON_VALUE
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

@RequestMapping("/api/groups", produces = [APPLICATION_JSON_VALUE])
@RestController
class GroupController(private val groupService: GroupService) {

    @GetMapping
    fun getGroupsInfo(): List<Group> = groupService.getGroups()

}