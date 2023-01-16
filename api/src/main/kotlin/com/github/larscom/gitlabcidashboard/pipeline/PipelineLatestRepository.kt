package com.github.larscom.gitlabcidashboard.pipeline

import com.github.benmanes.caffeine.cache.LoadingCache
import com.github.larscom.gitlabcidashboard.pipeline.model.Pipeline
import org.springframework.stereotype.Repository

@Repository
class PipelineLatestRepository(private val cache: LoadingCache<PipelineKey, Pipeline?>) {

    fun get(key: PipelineKey): Pipeline? {
        return cache.get(key)
    }
}