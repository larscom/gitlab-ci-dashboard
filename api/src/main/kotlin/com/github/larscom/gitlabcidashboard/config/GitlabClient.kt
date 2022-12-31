package com.github.larscom.gitlabcidashboard.config

import org.gitlab4j.api.GitLabApi
import org.gitlab4j.api.GroupApi
import org.gitlab4j.api.ProjectApi
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration

@Configuration
class GitlabClient {

    @Bean
    fun gitlabApi(
        gitlabConfig: GitlabConfig
    ): GitLabApi = GitLabApi(gitlabConfig.baseUrl, gitlabConfig.apiToken)

    @Bean
    fun groupApi(gitlabApi: GitLabApi): GroupApi = gitlabApi.groupApi

    @Bean
    fun projectApi(gitlabApi: GitLabApi): ProjectApi = gitlabApi.projectApi
}