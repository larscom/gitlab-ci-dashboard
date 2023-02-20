package com.github.larscom.gitlabcidashboard.project

import com.github.benmanes.caffeine.cache.LoadingCache
import com.github.larscom.gitlabcidashboard.project.model.Project
import org.springframework.stereotype.Repository

@Repository
class ProjectRepository(private val cache: LoadingCache<Long, List<Project>>) {

    fun get(groupId: Long): List<Project> {
        return cache.get(groupId)
    }
}
