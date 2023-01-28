package com.github.larscom.gitlabcidashboard.branch

import com.github.benmanes.caffeine.cache.LoadingCache
import com.github.larscom.gitlabcidashboard.branch.model.Branch
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
import java.util.*

@ExtendWith(MockitoExtension::class)
class BranchRepositoryTest {

    @Mock
    private lateinit var cache: LoadingCache<Long, List<Branch>>

    @InjectMocks
    private lateinit var branchRepository: BranchRepository

    @AfterEach
    fun afterEach() {
        verifyNoMoreInteractions(cache)
    }

    @Test
    fun `should get branches by projectId`() {
        val branches = listOf(mock(Branch::class.java))
        val projectId = 1L

        given(cache.get(projectId)).willReturn(branches)

        assertThat(branchRepository.get(projectId)).isEqualTo(branches)
    }
}