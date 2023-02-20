package com.github.larscom.gitlabcidashboard.pipeline

import com.github.benmanes.caffeine.cache.LoadingCache
import com.github.larscom.gitlabcidashboard.pipeline.model.Pipeline
import org.springframework.stereotype.Repository
import java.util.*

@Repository
class PipelineLatestRepository(private val cache: LoadingCache<PipelineKey, Optional<Pipeline>>) {

    fun get(key: PipelineKey): Pipeline? {
        return cache.get(key)?.orElse(null)
    }
}
