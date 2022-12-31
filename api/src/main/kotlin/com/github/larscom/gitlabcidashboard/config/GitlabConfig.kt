package com.github.larscom.gitlabcidashboard.config

import org.springframework.boot.context.properties.ConfigurationProperties
import org.springframework.boot.context.properties.ConstructorBinding

@ConstructorBinding
@ConfigurationProperties(prefix = "gitlab")
data class GitlabConfig(
    val baseUrl: String,
    val apiToken: String,
    val group: Group
) {
    init {
        require(baseUrl.isNotBlank()) { "GITLAB_BASE_URL is required as environment variable" }
        require(apiToken.isNotBlank()) { "GITLAB_API_TOKEN is required as environment variable" }
    }

    data class Group(
        val skipIds: List<Long>,
        val onlyIds: List<Long>
    )
}
