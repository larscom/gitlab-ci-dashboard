package com.github.larscom.gitlabcidashboard.branch.model

import com.fasterxml.jackson.annotation.JsonAlias
import java.time.Instant

data class Branch(
    val name: String,
    val merged: Boolean,
    val protected: Boolean,
    val default: Boolean,
    @JsonAlias("can_push") val canPush: Boolean,
    @JsonAlias("web_url") val webUrl: String,
    val commit: Commit
) {
    data class Commit(
        val id: String,
        @JsonAlias("author_name")
        val authorName: String,
        @JsonAlias("committer_name")
        val committerName: String,
        @JsonAlias("committed_date")
        val committedDate: Instant,
        val title: String,
        val message: String
    )
}
