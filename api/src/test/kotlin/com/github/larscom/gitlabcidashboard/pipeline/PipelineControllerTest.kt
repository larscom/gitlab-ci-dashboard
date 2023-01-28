package com.github.larscom.gitlabcidashboard.pipeline

import com.github.larscom.gitlabcidashboard.pipeline.model.Pipeline
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
class PipelineControllerTest {

    @Mock
    private lateinit var pipelineLatestRepository: PipelineLatestRepository

    @InjectMocks
    private lateinit var pipelineController: PipelineController

    @AfterEach
    fun afterEach() {
        verifyNoMoreInteractions(pipelineLatestRepository)
    }

    @Test
    fun `should get latest pipeline`() {
        val projectId = 1L
        val ref = "master"
        val pipeline = mock(Pipeline::class.java)

        given(pipelineLatestRepository.get(PipelineKey(projectId, ref)))
            .willReturn(pipeline)

        assertThat(pipelineController.getLatestPipeline(projectId, ref)).isEqualTo(pipeline)
    }
}