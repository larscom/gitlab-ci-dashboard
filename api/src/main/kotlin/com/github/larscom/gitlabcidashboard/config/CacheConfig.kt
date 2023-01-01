package com.github.larscom.gitlabcidashboard.config

import com.github.benmanes.caffeine.cache.Caffeine
import com.github.benmanes.caffeine.cache.LoadingCache
import com.github.benmanes.caffeine.cache.Ticker
import org.gitlab4j.api.GroupApi
import org.gitlab4j.api.models.Group
import org.springframework.cache.CacheManager
import org.springframework.cache.annotation.EnableCaching
import org.springframework.cache.caffeine.CaffeineCache
import org.springframework.cache.support.SimpleCacheManager
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import java.util.concurrent.TimeUnit

@Configuration
@EnableCaching
class CacheConfig {

    @Bean
    fun cacheManager(ticker: Ticker): CacheManager = SimpleCacheManager()
        .also { it.setCaches(listOf(buildCache("groups", ticker, 60))) }

    @Bean
    fun ticker(): Ticker = Ticker.systemTicker()

    private fun buildCache(name: String, ticker: Ticker, ttlSeconds: Long): CaffeineCache {
        return CaffeineCache(
            name, Caffeine.newBuilder()
                .expireAfterWrite(ttlSeconds, TimeUnit.SECONDS)
                .ticker(ticker)
                .build()
        )
    }

    @Bean
    fun groupCache(groupApi: GroupApi, ticker: Ticker): LoadingCache<Long, Group> = Caffeine.newBuilder()
        .expireAfterWrite(30, TimeUnit.SECONDS)
        .ticker(ticker)
        .build { groupApi.getGroup(it) }
}