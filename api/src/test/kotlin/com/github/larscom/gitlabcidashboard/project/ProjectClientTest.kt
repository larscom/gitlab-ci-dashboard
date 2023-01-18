package com.github.larscom.gitlabcidashboard.project

import com.github.larscom.gitlabcidashboard.createResponse
import com.github.larscom.gitlabcidashboard.feign.GitlabFeignClient
import com.github.larscom.gitlabcidashboard.project.model.Project
import feign.FeignException
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
class ProjectClientTest {

    @Mock
    private lateinit var gitlabFeignClient: GitlabFeignClient

    @InjectMocks
    private lateinit var projectClient: ProjectClient

    @AfterEach
    fun afterEach() {
        verifyNoMoreInteractions(gitlabFeignClient)
    }

    @Test
    fun `should return empty list when total pages is 0`() {
        given(gitlabFeignClient.getProjectsHead(anyLong(), anyInt())).willReturn(createResponse(totalPages = 0))

        assertThat(projectClient.getProjects(1)).isEmpty()
    }

    @Test
    fun `should merge projects from all pages`() {
        val groupId = 1L
        val page1Projects = listOf(mock(Project::class.java), mock(Project::class.java), mock(Project::class.java))
        val page2Projects = listOf(mock(Project::class.java), mock(Project::class.java))

        given(gitlabFeignClient.getProjectsHead(anyLong(), anyInt())).willReturn(createResponse(totalPages = 2))

        given(gitlabFeignClient.getProjects(groupId = groupId, page = 1)).willReturn(page1Projects)
        given(gitlabFeignClient.getProjects(groupId = groupId, page = 2)).willReturn(page2Projects)

        assertThat(projectClient.getProjects(groupId)).isEqualTo(page1Projects.plus(page2Projects))
    }

    @Test
    fun `should merge projects from all pages even if one fails`() {
        val groupId = 1L
        val page1Projects = listOf(mock(Project::class.java), mock(Project::class.java), mock(Project::class.java))
        val page3Projects = listOf(mock(Project::class.java), mock(Project::class.java))

        given(gitlabFeignClient.getProjectsHead(anyLong(), anyInt())).willReturn(createResponse(totalPages = 3))

        given(gitlabFeignClient.getProjects(groupId = groupId, page = 1))
            .willReturn(page1Projects)
        given(gitlabFeignClient.getProjects(groupId = groupId, page = 2))
            .willThrow(
                FeignException.InternalServerError(
                    "ERROR!", mock(feign.Request::class.java), byteArrayOf(), mapOf()
                )
            )
        given(gitlabFeignClient.getProjects(groupId = groupId, page = 3))
            .willReturn(page3Projects)

        assertThat(projectClient.getProjects(groupId)).isEqualTo(page1Projects.plus(page3Projects))
    }
}