package com.github.larscom.gitlabcidashboard.config

import com.github.benmanes.caffeine.cache.Caffeine
import com.github.benmanes.caffeine.cache.LoadingCache
import com.github.benmanes.caffeine.cache.Ticker
import com.github.larscom.gitlabcidashboard.branch.BranchClient
import com.github.larscom.gitlabcidashboard.branch.model.Branch
import com.github.larscom.gitlabcidashboard.pipeline.PipelineClient
import com.github.larscom.gitlabcidashboard.pipeline.PipelineKey
import com.github.larscom.gitlabcidashboard.pipeline.model.Pipeline
import com.github.larscom.gitlabcidashboard.project.ProjectClient
import com.github.larscom.gitlabcidashboard.project.model.Project
import org.springframework.beans.factory.annotation.Value
import org.springframework.cache.annotation.EnableCaching
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import java.time.Duration
import java.util.*

@Configuration
@EnableCaching
class CacheConfig {

    @Bean
    fun ticker(): Ticker = Ticker.systemTicker()

    @Bean
    fun projectCache(
        @Value("\${gitlab.project.cache_ttl_seconds}") ttlSeconds: Long,
        client: ProjectClient,
        ticker: Ticker
    ): LoadingCache<Long, List<Project>> = Caffeine.newBuilder()
        .expireAfterWrite(Duration.ofSeconds(ttlSeconds))
        .ticker(ticker)
        .build { client.getProjects(it) }

    @Bean
    fun brancheCache(
        @Value("\${gitlab.branch.cache_ttl_seconds}") ttlSeconds: Long,
        client: BranchClient,
        ticker: Ticker
    ): LoadingCache<Long, List<Branch>> = Caffeine.newBuilder()
        .expireAfterWrite(Duration.ofSeconds(ttlSeconds))
        .ticker(ticker)
        .build { client.getBranches(it) }

    @Bean
    fun pipelineCache(
        @Value("\${gitlab.pipeline.cache_ttl_seconds}") ttlSeconds: Long,
        client: PipelineClient,
        ticker: Ticker
    ): LoadingCache<PipelineKey, Optional<Pipeline>> =
        Caffeine.newBuilder()
            .expireAfterWrite(Duration.ofSeconds(ttlSeconds))
            .ticker(ticker)
            .build { Optional.ofNullable(client.getLatestPipeline(projectId = it.projectId, ref = it.ref)) }
}
