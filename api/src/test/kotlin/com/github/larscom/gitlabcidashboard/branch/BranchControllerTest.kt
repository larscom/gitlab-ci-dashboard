package com.github.larscom.gitlabcidashboard.branch

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


@ExtendWith(MockitoExtension::class)
class BranchControllerTest {

    @Mock
    private lateinit var branchRepository: BranchRepository

    @InjectMocks
    private lateinit var branchController: BranchController

    @AfterEach
    fun afterEach() {
        verifyNoMoreInteractions(branchRepository)
    }

    @Test
    fun `should get all branches for projectId`() {
        val projectId = 1L
        val branches = listOf(mock(Branch::class.java))

        given(branchRepository.get(projectId))
            .willReturn(branches)

        assertThat(branchController.getBranches(projectId)).isEqualTo(branches)
    }
}