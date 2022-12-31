package com.github.larscom.gitlabcidashboard.config

import org.gitlab4j.api.GitLabApi
import org.gitlab4j.api.GroupApi
import org.gitlab4j.api.ProjectApi
import org.springframework.beans.factory.annotation.Value
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration

@Configuration
class Gitlab {

    @Bean
    fun gitlabClient(
        @Value("\${gitlab.base_url}") baseUrl: String,
        @Value("\${gitlab.api_token}") apiToken: String
    ): GitLabApi = GitLabApi(baseUrl, apiToken)

    @Bean
    fun groupApi(gitlabApi: GitLabApi): GroupApi = gitlabApi.groupApi

    @Bean
    fun projectApi(gitlabApi: GitLabApi): ProjectApi = gitlabApi.projectApi
}