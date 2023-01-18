package com.github.larscom.gitlabcidashboard.project

import com.github.larscom.gitlabcidashboard.pipeline.model.Pipeline
import com.github.larscom.gitlabcidashboard.project.model.ProjectWithLatestPipeline
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.AfterEach
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.extension.ExtendWith
import org.mockito.BDDMockito.given
import org.mockito.InjectMocks
import org.mockito.Mock
import org.mockito.Mockito.verifyNoMoreInteractions
import org.mockito.junit.jupiter.MockitoExtension

@ExtendWith(MockitoExtension::class)
class ProjectControllerTest {

    @Mock
    private lateinit var projectService: ProjectService

    @Mock
    private lateinit var projectsWithLatestPipeline: Map<Pipeline.Status, List<ProjectWithLatestPipeline>>

    @InjectMocks
    private lateinit var projectController: ProjectController

    @AfterEach
    fun afterEach() {
        verifyNoMoreInteractions(projectService)
    }

    @Test
    fun `should get projects grouped by status`() {
        val groupId = 1L

        given(projectService.getProjectsGroupedByStatus(groupId = groupId)).willReturn(projectsWithLatestPipeline)

        assertThat(projectController.getProjectsGroupedByStatus(groupId)).isEqualTo(projectsWithLatestPipeline)
    }
}