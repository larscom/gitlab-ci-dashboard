package com.github.larscom.gitlabcidashboard.project

import com.github.larscom.gitlabcidashboard.pipeline.PipelineKey
import com.github.larscom.gitlabcidashboard.pipeline.PipelineLatestRepository
import com.github.larscom.gitlabcidashboard.pipeline.model.Pipeline
import com.github.larscom.gitlabcidashboard.project.model.Project
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.AfterEach
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.extension.ExtendWith
import org.mockito.Mock
import org.mockito.Mockito.verifyNoMoreInteractions
import org.mockito.Mockito.`when`
import org.mockito.junit.jupiter.MockitoExtension
import java.time.Instant
import java.util.function.Consumer

@ExtendWith(MockitoExtension::class)
class ProjectServiceTest {

    @Mock
    private lateinit var projectRepository: ProjectRepository

    @Mock
    private lateinit var pipelineLatestRepository: PipelineLatestRepository

    private lateinit var projectService: ProjectService

    @BeforeEach
    fun beforeEach() {
        projectService = ProjectService(
            hideUnknownProjects = false,
            projectRepository = projectRepository,
            pipelineLatestRepository = pipelineLatestRepository
        )
    }

    @AfterEach
    fun afterEach() {
        verifyNoMoreInteractions(projectRepository, pipelineLatestRepository)
    }

    @Test
    fun `should get projects grouped by status`() {
        val groupId = 1L
        val projects = listOf(
            Project(id = 10, name = "Project 1", defaultBranch = "master"),
            Project(id = 11, name = "Project 2", defaultBranch = "master"),
            Project(id = 12, name = "Project 3", defaultBranch = "master"),
            Project(id = 13, name = "Project 4", defaultBranch = "master"),
        )
        val pipelineSuccess1 = createPipeline(projectId = 10, status = Pipeline.Status.SUCCESS)
        val pipelineSuccess2 = createPipeline(projectId = 11, status = Pipeline.Status.SUCCESS)
        val pipelineFailed = createPipeline(projectId = 12, status = Pipeline.Status.FAILED)

        `when`(projectRepository.get(groupId)).thenReturn(projects)
        `when`(pipelineLatestRepository.get(PipelineKey(projectId = 10, ref = "master")))
            .thenReturn(pipelineSuccess1)
        `when`(pipelineLatestRepository.get(PipelineKey(projectId = 11, ref = "master")))
            .thenReturn(pipelineSuccess2)
        `when`(pipelineLatestRepository.get(PipelineKey(projectId = 12, ref = "master")))
            .thenReturn(pipelineFailed)
        `when`(pipelineLatestRepository.get(PipelineKey(projectId = 13, ref = "master")))
            .thenReturn(null)

        val projectsGroupedByStatus = projectService.getProjectsGroupedByStatus(groupId)

        assertThat(projectsGroupedByStatus.keys).containsExactly(
            Pipeline.Status.SUCCESS,
            Pipeline.Status.FAILED,
            Pipeline.Status.UNKNOWN
        )
        assertThat(projectsGroupedByStatus.getValue(Pipeline.Status.SUCCESS)).satisfies(
            Consumer { list ->
                assertThat(list)
                    .hasSize(2)
                    .anySatisfy(
                        Consumer {
                            assertThat(it.pipeline).isEqualTo(pipelineSuccess1)
                            assertThat(it.project.id).isEqualTo(10)
                            assertThat(it.project.defaultBranch).isEqualTo("master")
                            assertThat(it.project.name).isEqualTo("Project 1")
                            assertThat(it.project.topics).isEmpty()
                        }
                    )
                    .anySatisfy(
                        Consumer {
                            assertThat(it.pipeline).isEqualTo(pipelineSuccess2)
                            assertThat(it.project.id).isEqualTo(11)
                            assertThat(it.project.defaultBranch).isEqualTo("master")
                            assertThat(it.project.name).isEqualTo("Project 2")
                            assertThat(it.project.topics).isEmpty()
                        }
                    )
            }
        )
        assertThat(projectsGroupedByStatus.getValue(Pipeline.Status.FAILED)).satisfies(
            Consumer { list ->
                assertThat(list)
                    .hasSize(1)
                    .anySatisfy(
                        Consumer {
                            assertThat(it.pipeline).isEqualTo(pipelineFailed)
                            assertThat(it.project.id).isEqualTo(12)
                            assertThat(it.project.defaultBranch).isEqualTo("master")
                            assertThat(it.project.name).isEqualTo("Project 3")
                            assertThat(it.project.topics).isEmpty()
                        }
                    )
            }
        )
        assertThat(projectsGroupedByStatus.getValue(Pipeline.Status.UNKNOWN)).satisfies(
            Consumer { list ->
                assertThat(list)
                    .hasSize(1)
                    .anySatisfy(
                        Consumer {
                            assertThat(it.pipeline).isNull()
                            assertThat(it.project.id).isEqualTo(13)
                            assertThat(it.project.defaultBranch).isEqualTo("master")
                            assertThat(it.project.name).isEqualTo("Project 4")
                            assertThat(it.project.topics).isEmpty()
                        }
                    )
            }
        )
    }

    @Test
    fun `should filter projects with unknown pipeline status`() {
        projectService = ProjectService(
            hideUnknownProjects = true,
            projectRepository = projectRepository,
            pipelineLatestRepository = pipelineLatestRepository
        )
        val groupId = 1L
        val projects = listOf(
            Project(id = 10, name = "Project 1", defaultBranch = "master"),
            Project(id = 11, name = "Project 2", defaultBranch = "master")
        )
        val pipelineSuccess = createPipeline(projectId = 10, status = Pipeline.Status.SUCCESS)

        `when`(projectRepository.get(groupId)).thenReturn(projects)
        `when`(pipelineLatestRepository.get(PipelineKey(projectId = 10, ref = "master")))
            .thenReturn(pipelineSuccess)
        `when`(pipelineLatestRepository.get(PipelineKey(projectId = 11, ref = "master")))
            .thenReturn(null)

        val projectsGroupedByStatus = projectService.getProjectsGroupedByStatus(groupId)

        assertThat(projectsGroupedByStatus.keys).containsExactly(Pipeline.Status.SUCCESS)
        assertThat(projectsGroupedByStatus.getValue(Pipeline.Status.SUCCESS)).satisfies(
            Consumer { list ->
                assertThat(list)
                    .hasSize(1)
                    .anySatisfy(
                        Consumer {
                            assertThat(it.pipeline).isEqualTo(pipelineSuccess)
                            assertThat(it.project.id).isEqualTo(10)
                        }
                    )
            }
        )
    }

    private fun createPipeline(projectId: Long, status: Pipeline.Status): Pipeline = Pipeline(
        projectId = projectId,
        status = status,
        id = 0,
        iid = 0,
        sha = "sha",
        source = Pipeline.Source.API,
        createdAt = Instant.EPOCH,
        updatedAt = Instant.now(),
        webUrl = "webUrl"
    )
}