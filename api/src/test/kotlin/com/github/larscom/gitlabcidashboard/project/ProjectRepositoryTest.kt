package com.github.larscom.gitlabcidashboard.project

import com.github.benmanes.caffeine.cache.LoadingCache
import com.github.larscom.gitlabcidashboard.project.model.Project
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
class ProjectRepositoryTest {

    @Mock
    private lateinit var cache: LoadingCache<Long, List<Project>>

    @InjectMocks
    private lateinit var projectRepository: ProjectRepository

    @AfterEach
    fun afterEach() {
        verifyNoMoreInteractions(cache)
    }

    @Test
    fun `should get projects`() {
        val projects = listOf(mock(Project::class.java))
        val groupId = 1L

        `when`(cache.get(groupId)).thenReturn(projects)

        assertThat(projectRepository.get(groupId)).isEqualTo(projects)
    }
}