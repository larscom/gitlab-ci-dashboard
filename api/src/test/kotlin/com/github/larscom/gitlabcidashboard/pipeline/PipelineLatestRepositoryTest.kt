package com.github.larscom.gitlabcidashboard.pipeline

import com.github.benmanes.caffeine.cache.LoadingCache
import com.github.larscom.gitlabcidashboard.pipeline.model.Pipeline
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.AfterEach
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.extension.ExtendWith
import org.mockito.InjectMocks
import org.mockito.Mock
import org.mockito.Mockito.mock
import org.mockito.Mockito.verifyNoMoreInteractions
import org.mockito.Mockito.`when`
import org.mockito.junit.jupiter.MockitoExtension

@ExtendWith(MockitoExtension::class)
class PipelineLatestRepositoryTest {

    @Mock
    private lateinit var cache: LoadingCache<PipelineKey, Pipeline?>

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

        `when`(cache.get(pipelineKey)).thenReturn(pipeline)

        assertThat(pipelineLatestRepository.get(pipelineKey)).isEqualTo(pipeline)
    }
}