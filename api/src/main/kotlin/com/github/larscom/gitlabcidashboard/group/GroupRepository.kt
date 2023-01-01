package com.github.larscom.gitlabcidashboard.group

import com.github.benmanes.caffeine.cache.LoadingCache
import org.gitlab4j.api.models.Group
import org.springframework.stereotype.Repository

@Repository
class GroupRepository(private val loadingCache: LoadingCache<Long, Group>) {

    fun get(groupId: Long): Group {
        return loadingCache.get(groupId)
    }
}