package com.github.larscom.gitlabcidashboard.pipeline.model

import com.fasterxml.jackson.annotation.JsonAlias
import com.fasterxml.jackson.annotation.JsonCreator
import com.fasterxml.jackson.annotation.JsonValue
import java.time.Instant

data class Pipeline(
    val id: Long,
    val iid: Long,
    @JsonAlias("project_id")
    val projectId: Long,
    val sha: String,
    val status: Status,
    val source: Source,
    @JsonAlias("created_at")
    val createdAt: Instant,
    @JsonAlias("updated_at")
    val updatedAt: Instant,
    @JsonAlias("web_url")
    val webUrl: String,
) {
    enum class Status {
        UNKNOWN,
        CREATED,
        WAITING_FOR_RESOURCE,
        PREPARING,
        PENDING,
        RUNNING,
        SUCCESS,
        FAILED,
        CANCELED,
        SKIPPED,
        MANUAL,
        SCHEDULED;

        @JsonCreator
        fun toStatus(value: String): Status? {
            return Status.values().firstOrNull { it.getValue() == value }
        }

        @JsonValue
        fun getValue() = toString()

        override fun toString(): String {
            return name.lowercase()
        }
    }

    enum class Source {
        PUSH,
        WEB,
        TRIGGER,
        SCHEDULE,
        API,
        EXTERNAL,
        PIPELINE,
        CHAT,
        WEBIDE,
        MERGE_REQUEST_EVENT,
        EXTERNAL_PULL_REQUEST_EVENT,
        PARENT_PIPELINE,
        ONDEMAND_DAST_SCAN,
        ONDEMAND_DAST_VALIDATION;

        @JsonCreator
        fun toSource(value: String): Source? {
            return Source.values().firstOrNull { it.getValue() == value }
        }

        @JsonValue
        fun getValue() = toString()

        override fun toString(): String {
            return name.lowercase()
        }
    }
}