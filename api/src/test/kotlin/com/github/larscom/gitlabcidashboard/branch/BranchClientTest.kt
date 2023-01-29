package com.github.larscom.gitlabcidashboard.branch

import com.github.larscom.gitlabcidashboard.branch.model.Branch
import com.github.larscom.gitlabcidashboard.createResponse
import com.github.larscom.gitlabcidashboard.feign.GitlabFeignClient
import feign.FeignException
import feign.Request
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.AfterEach
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.extension.ExtendWith
import org.mockito.BDDMockito.given
import org.mockito.InjectMocks
import org.mockito.Mock
import org.mockito.Mockito.anyInt
import org.mockito.Mockito.anyLong
import org.mockito.Mockito.mock
import org.mockito.Mockito.verifyNoMoreInteractions
import org.mockito.junit.jupiter.MockitoExtension

@ExtendWith(MockitoExtension::class)
class BranchClientTest {

    @Mock
    private lateinit var gitlabFeignClient: GitlabFeignClient

    @InjectMocks
    private lateinit var branchClient: BranchClient

    @AfterEach
    fun afterEach() {
        verifyNoMoreInteractions(gitlabFeignClient)
    }

    @Test
    fun `should return empty list when total pages is 0`() {
        given(gitlabFeignClient.getBranchesHead(anyLong(), anyInt()))
            .willReturn(createResponse(totalPages = 0))

        assertThat(branchClient.getBranches(1)).isEmpty()
    }

    @Test
    fun `should merge branches from all pages`() {
        val projectId = 1L
        val page1Branches = listOf(
            mock(Branch::class.java),
            mock(Branch::class.java),
            mock(Branch::class.java)
        )
        val page2branches = listOf(mock(Branch::class.java), mock(Branch::class.java))

        given(gitlabFeignClient.getBranchesHead(anyLong(), anyInt()))
            .willReturn(createResponse(totalPages = 2))

        given(gitlabFeignClient.getBranches(projectId = projectId, page = 1)).willReturn(page1Branches)
        given(gitlabFeignClient.getBranches(projectId = projectId, page = 2)).willReturn(page2branches)

        assertThat(branchClient.getBranches(projectId)).isEqualTo(page1Branches.plus(page2branches))
    }

    @Test
    fun `should merge branches from all pages even if one request fails`() {
        val projectId = 1L
        val page1Branches = listOf(
            mock(Branch::class.java),
            mock(Branch::class.java),
            mock(Branch::class.java)
        )
        val page3Branches = listOf(mock(Branch::class.java), mock(Branch::class.java))

        given(gitlabFeignClient.getBranchesHead(anyLong(), anyInt()))
            .willReturn(createResponse(totalPages = 3))

        given(gitlabFeignClient.getBranches(projectId = projectId, page = 1))
            .willReturn(page1Branches)
        given(gitlabFeignClient.getBranches(projectId = projectId, page = 2))
            .willThrow(
                FeignException.InternalServerError(
                    "ERROR!", mock(Request::class.java), byteArrayOf(), mapOf()
                )
            )
        given(gitlabFeignClient.getBranches(projectId = projectId, page = 3))
            .willReturn(page3Branches)

        assertThat(branchClient.getBranches(projectId)).isEqualTo(page1Branches.plus(page3Branches))
    }
}