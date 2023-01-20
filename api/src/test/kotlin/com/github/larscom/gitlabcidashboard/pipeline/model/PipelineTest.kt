package com.github.larscom.gitlabcidashboard.pipeline.model

import com.github.larscom.gitlabcidashboard.pipeline.model.Pipeline.Source.API
import com.github.larscom.gitlabcidashboard.pipeline.model.Pipeline.Source.CHAT
import com.github.larscom.gitlabcidashboard.pipeline.model.Pipeline.Source.EXTERNAL
import com.github.larscom.gitlabcidashboard.pipeline.model.Pipeline.Source.EXTERNAL_PULL_REQUEST_EVENT
import com.github.larscom.gitlabcidashboard.pipeline.model.Pipeline.Source.MERGE_REQUEST_EVENT
import com.github.larscom.gitlabcidashboard.pipeline.model.Pipeline.Source.ONDEMAND_DAST_SCAN
import com.github.larscom.gitlabcidashboard.pipeline.model.Pipeline.Source.ONDEMAND_DAST_VALIDATION
import com.github.larscom.gitlabcidashboard.pipeline.model.Pipeline.Source.PARENT_PIPELINE
import com.github.larscom.gitlabcidashboard.pipeline.model.Pipeline.Source.PIPELINE
import com.github.larscom.gitlabcidashboard.pipeline.model.Pipeline.Source.PUSH
import com.github.larscom.gitlabcidashboard.pipeline.model.Pipeline.Source.SCHEDULE
import com.github.larscom.gitlabcidashboard.pipeline.model.Pipeline.Source.TRIGGER
import com.github.larscom.gitlabcidashboard.pipeline.model.Pipeline.Source.WEB
import com.github.larscom.gitlabcidashboard.pipeline.model.Pipeline.Source.WEBIDE
import com.github.larscom.gitlabcidashboard.pipeline.model.Pipeline.Status.CANCELED
import com.github.larscom.gitlabcidashboard.pipeline.model.Pipeline.Status.CREATED
import com.github.larscom.gitlabcidashboard.pipeline.model.Pipeline.Status.FAILED
import com.github.larscom.gitlabcidashboard.pipeline.model.Pipeline.Status.MANUAL
import com.github.larscom.gitlabcidashboard.pipeline.model.Pipeline.Status.PENDING
import com.github.larscom.gitlabcidashboard.pipeline.model.Pipeline.Status.PREPARING
import com.github.larscom.gitlabcidashboard.pipeline.model.Pipeline.Status.RUNNING
import com.github.larscom.gitlabcidashboard.pipeline.model.Pipeline.Status.SCHEDULED
import com.github.larscom.gitlabcidashboard.pipeline.model.Pipeline.Status.SKIPPED
import com.github.larscom.gitlabcidashboard.pipeline.model.Pipeline.Status.SUCCESS
import com.github.larscom.gitlabcidashboard.pipeline.model.Pipeline.Status.UNKNOWN
import com.github.larscom.gitlabcidashboard.pipeline.model.Pipeline.Status.WAITING_FOR_RESOURCE
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test

class PipelineTest {

    @Test
    fun `should be able to convert string value to enum Status`() {
        assertThat(Pipeline.Status.values()).containsExactly(
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
            SCHEDULED
        )
        Pipeline.Status.values().forEach {
            assertThat(it.fromString(it.name)).isEqualTo(it)
        }
        assertThat(UNKNOWN.fromString(null)).isNull()
    }

    @Test
    fun `should be able to convert string value to enum Source`() {
        assertThat(Pipeline.Source.values()).containsExactly(
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
            ONDEMAND_DAST_VALIDATION
        )
        Pipeline.Source.values().forEach {
            assertThat(it.fromString(it.name)).isEqualTo(it)
        }
        assertThat(PIPELINE.fromString(null)).isNull()
    }

    @Test
    fun `Status should have custom toString()`() {
        assertThat(Pipeline.Status.FAILED.toString()).isEqualTo("failed")
    }

    @Test
    fun `Source should have custom toString()`() {
        assertThat(Pipeline.Source.PUSH.toString()).isEqualTo("push")
    }
}