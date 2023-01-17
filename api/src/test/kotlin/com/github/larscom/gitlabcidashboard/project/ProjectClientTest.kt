package com.github.larscom.gitlabcidashboard.project

import com.github.larscom.gitlabcidashboard.createResponse
import com.github.larscom.gitlabcidashboard.feign.GitlabFeignClient
import com.github.larscom.gitlabcidashboard.project.model.Project
import feign.FeignException
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.AfterEach
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.extension.ExtendWith
import org.mockito.InjectMocks
import org.mockito.Mock
import org.mockito.Mockito.anyInt
import org.mockito.Mockito.anyLong
import org.mockito.Mockito.mock
import org.mockito.Mockito.verifyNoMoreInteractions
import org.mockito.Mockito.`when`
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
    fun `should merge projects from all pages`() {
        val groupId = 1L
        val page1Projects = listOf(mock(Project::class.java), mock(Project::class.java), mock(Project::class.java))
        val page2Projects = listOf(mock(Project::class.java), mock(Project::class.java))

        `when`(gitlabFeignClient.getProjectsHead(anyLong(), anyInt()))
            .thenReturn(createResponse(totalPages = 2))

        `when`(gitlabFeignClient.getProjects(groupId = groupId, page = 1))
            .thenReturn(page1Projects)
        `when`(gitlabFeignClient.getProjects(groupId = groupId, page = 2))
            .thenReturn(page2Projects)

        assertThat(projectClient.getProjects(groupId)).isEqualTo(page1Projects.plus(page2Projects))
    }

    @Test
    fun `should merge projects from all pages even if one fails`() {
        val groupId = 1L
        val page1Projects = listOf(mock(Project::class.java), mock(Project::class.java), mock(Project::class.java))
        val page3Projects = listOf(mock(Project::class.java), mock(Project::class.java))

        `when`(gitlabFeignClient.getProjectsHead(anyLong(), anyInt()))
            .thenReturn(createResponse(totalPages = 3))

        `when`(gitlabFeignClient.getProjects(groupId = groupId, page = 1))
            .thenReturn(page1Projects)
        `when`(gitlabFeignClient.getProjects(groupId = groupId, page = 2))
            .thenThrow(
                FeignException.InternalServerError(
                    "ERROR!", mock(feign.Request::class.java), byteArrayOf(), mapOf()
                )
            )
        `when`(gitlabFeignClient.getProjects(groupId = groupId, page = 3))
            .thenReturn(page3Projects)

        assertThat(projectClient.getProjects(groupId)).isEqualTo(page1Projects.plus(page3Projects))
    }
}