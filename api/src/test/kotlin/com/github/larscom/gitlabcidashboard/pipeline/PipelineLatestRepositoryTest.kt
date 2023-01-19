package com.github.larscom.gitlabcidashboard.pipeline

import com.github.benmanes.caffeine.cache.LoadingCache
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
import java.util.Optional

@ExtendWith(MockitoExtension::class)
class PipelineLatestRepositoryTest {

    @Mock
    private lateinit var cache: LoadingCache<PipelineKey, Optional<Pipeline>>

    @InjectMocks
    private lateinit var pipelineLatestRepository: PipelineLatestRepository

    @AfterEach
    fun afterEach() {
        verifyNoMoreInteractions(cache)
    }

    @Test
    fun `should get pipeline`() {
        val pipeline = mock(Pipeline::class.java)
        val pipelineKey = PipelineKey(projectId = 1, ref = "ref")

        given(cache.get(pipelineKey)).willReturn(Optional.of(pipeline))

        assertThat(pipelineLatestRepository.get(pipelineKey)).isEqualTo(pipeline)
    }

    @Test
    fun `should return null when optional empty`() {
        val pipelineKey = PipelineKey(projectId = 1, ref = "ref")

        given(cache.get(pipelineKey)).willReturn(Optional.empty())

        assertThat(pipelineLatestRepository.get(pipelineKey)).isNull()
    }

    @Test
    fun `should return null when null`() {
        val pipelineKey = PipelineKey(projectId = 1, ref = "ref")

        given(cache.get(pipelineKey)).willReturn(null)

        assertThat(pipelineLatestRepository.get(pipelineKey)).isNull()
    }
}