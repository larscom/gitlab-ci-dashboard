package com.github.larscom.gitlabcidashboard.branch

import com.github.benmanes.caffeine.cache.LoadingCache
import com.github.larscom.gitlabcidashboard.branch.model.Branch
import org.springframework.stereotype.Repository

@Repository
class BranchRepository(private val cache: LoadingCache<Long, List<Branch>>) {

    fun get(projectId: Long): List<Branch> {
        return cache.get(projectId)
    }
}
