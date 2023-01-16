package com.github.larscom.gitlabcidashboard.config

import feign.RequestInterceptor
import org.springframework.beans.factory.annotation.Value
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration

@Configuration
class FeignConfig {

    @Bean
    fun requestInterceptor(@Value("\${gitlab.api_token}") apiToken: String): RequestInterceptor {
        return RequestInterceptor { request -> request.header("Authorization", "Bearer $apiToken") }
    }
    
}