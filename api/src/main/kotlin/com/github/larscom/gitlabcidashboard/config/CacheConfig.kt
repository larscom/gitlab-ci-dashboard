package com.github.larscom.gitlabcidashboard.config

import com.github.benmanes.caffeine.cache.Caffeine
import com.github.benmanes.caffeine.cache.LoadingCache
import com.github.benmanes.caffeine.cache.Ticker
import com.github.larscom.gitlabcidashboard.pipeline.PipelineClient
import com.github.larscom.gitlabcidashboard.pipeline.PipelineKey
import com.github.larscom.gitlabcidashboard.pipeline.model.Pipeline
import com.github.larscom.gitlabcidashboard.project.ProjectClient
import com.github.larscom.gitlabcidashboard.project.model.Project
import org.springframework.cache.annotation.EnableCaching
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import java.time.Duration

@Configuration
@EnableCaching
class CacheConfig {

    @Bean
    fun projectsCache(client: ProjectClient, ticker: Ticker): LoadingCache<Long, List<Project>> = Caffeine.newBuilder()
        .expireAfterWrite(Duration.ofMinutes(5))
        .refreshAfterWrite(Duration.ofSeconds(120))
        .ticker(ticker)
        .build { client.getProjects(it) }

    @Bean
    fun pipelineCache(client: PipelineClient, ticker: Ticker): LoadingCache<PipelineKey, Pipeline?> =
        Caffeine.newBuilder()
            .expireAfterWrite(Duration.ofMinutes(3))
            .refreshAfterWrite(Duration.ofSeconds(5))
            .ticker(ticker)
            .build { client.getLatestPipeline(projectId = it.projectId, ref = it.ref) }

    @Bean
    fun ticker(): Ticker = Ticker.systemTicker()
}