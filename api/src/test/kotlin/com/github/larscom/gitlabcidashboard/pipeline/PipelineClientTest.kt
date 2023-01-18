package com.github.larscom.gitlabcidashboard.pipeline

import com.github.larscom.gitlabcidashboard.feign.GitlabFeignClient
import com.github.larscom.gitlabcidashboard.pipeline.model.Pipeline
import feign.FeignException
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.AfterEach
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.extension.ExtendWith
import org.mockito.BDDMockito.given
import org.mockito.InjectMocks
import org.mockito.Mock
import org.mockito.Mockito.mock
import org.mockito.Mockito.verifyNoMoreInteractions
import org.mockito.junit.jupiter.MockitoExtension

@ExtendWith(MockitoExtension::class)
class PipelineClientTest {

    @Mock
    private lateinit var gitlabFeignClient: GitlabFeignClient

    @InjectMocks
    private lateinit var pipelineClient: PipelineClient

    @AfterEach
    fun afterEach() {
        verifyNoMoreInteractions(gitlabFeignClient)
    }

    @Test
    fun `should get latest pipeline`() {
        val projectId = 1L
        val ref = "master"
        val pipeline = mock(Pipeline::class.java)

        given(gitlabFeignClient.getLatestPipeline(projectId = projectId, ref = ref))
            .willReturn(pipeline)

        assertThat(pipelineClient.getLatestPipeline(projectId = projectId, ref = ref))
            .isEqualTo(pipeline)
    }

    @Test
    fun `should return null when an exception occurs while getting the latest pipeline`() {
        val projectId = 1L
        val ref = "master"

        given(gitlabFeignClient.getLatestPipeline(projectId = projectId, ref = ref))
            .willThrow(
                FeignException.InternalServerError(
                    "ERROR!", mock(feign.Request::class.java), byteArrayOf(), mapOf()
                )
            )

        assertThat(pipelineClient.getLatestPipeline(projectId = projectId, ref = ref))
            .isNull()
    }

    @Test
    fun `should get pipelines`() {
        val projectId = 1L
        val ref = "master"
        val pipelines = listOf(mock(Pipeline::class.java))

        given(gitlabFeignClient.getPipelines(projectId = projectId, ref = ref))
            .willReturn(pipelines)

        assertThat(pipelineClient.getPipelines(projectId = projectId, ref = ref))
            .isEqualTo(pipelines)
    }

    @Test
    fun `should return empty list when an exception occurs while getting pipelines`() {
        val projectId = 1L
        val ref = "master"

        given(gitlabFeignClient.getPipelines(projectId = projectId, ref = ref))
            .willThrow(
                FeignException.InternalServerError(
                    "ERROR!", mock(feign.Request::class.java), byteArrayOf(), mapOf()
                )
            )

        assertThat(pipelineClient.getPipelines(projectId = projectId, ref = ref))
            .isEmpty()
    }
}