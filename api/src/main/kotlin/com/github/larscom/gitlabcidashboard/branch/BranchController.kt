package com.github.larscom.gitlabcidashboard.branch

import com.github.larscom.gitlabcidashboard.branch.model.Branch
import org.springframework.http.MediaType
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

@RequestMapping("/api/branches/{projectId}", produces = [MediaType.APPLICATION_JSON_VALUE])
@RestController
class BranchController(private val branchRepository: BranchRepository) {

    @GetMapping
    fun getBranches(
        @PathVariable("projectId") projectId: Long
    ): List<Branch> = branchRepository.get(projectId)
}