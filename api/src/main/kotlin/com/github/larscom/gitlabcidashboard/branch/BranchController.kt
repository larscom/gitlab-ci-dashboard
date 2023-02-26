package com.github.larscom.gitlabcidashboard.branch

import com.github.larscom.gitlabcidashboard.branch.model.BranchPipeline
import org.springframework.http.MediaType
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

@RequestMapping("/api/branches/{projectId}", produces = [MediaType.APPLICATION_JSON_VALUE])
@RestController
class BranchController(private val branchService: BranchService) {

    @GetMapping
    fun getBranchesWithLatestPipeline(
        @PathVariable("projectId") projectId: Long
    ): List<BranchPipeline> = branchService.getBranchesWithLatestPipeline(projectId)

}
