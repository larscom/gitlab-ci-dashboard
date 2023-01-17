package com.github.larscom.gitlabcidashboard.project

import com.adelean.inject.resources.junit.jupiter.GivenTextResource
import com.adelean.inject.resources.junit.jupiter.TestWithResources
import com.fasterxml.jackson.core.type.TypeReference
import com.fasterxml.jackson.databind.ObjectMapper
import com.fasterxml.jackson.module.kotlin.readValue
import com.github.larscom.gitlabcidashboard.feign.GitlabFeignClient
import com.github.larscom.gitlabcidashboard.pipeline.model.Pipeline
import com.github.larscom.gitlabcidashboard.project.model.ProjectWithLatestPipeline
import feign.Request
import feign.Response
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.mockito.Mockito.*
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.boot.test.mock.mockito.MockBean
import org.springframework.http.HttpStatus
import org.springframework.http.MediaType.APPLICATION_JSON
import org.springframework.test.context.ActiveProfiles
import org.springframework.test.web.servlet.MockMvc
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.status
import java.util.function.Consumer

@TestWithResources
@AutoConfigureMockMvc
@ActiveProfiles("test")
@SpringBootTest
class ProjectControllerIT {

    @GivenTextResource("/json/projects.json")
    lateinit var projectsJson: String

    @GivenTextResource("/json/pipelines.json")
    lateinit var pipelinesJson: String

    @Autowired
    lateinit var objectMapper: ObjectMapper

    @Autowired
    lateinit var mvc: MockMvc

    @MockBean
    lateinit var gitlabFeignClient: GitlabFeignClient

    @BeforeEach
    fun beforeEach() {
        `when`(gitlabFeignClient.getProjectsHead(1, 100))
            .thenReturn(
                Response.builder()
                    .request(Request.create(Request.HttpMethod.HEAD, "", mapOf(), null, null, null))
                    .status(HttpStatus.OK.value())
                    .headers(mapOf("x-total-pages" to listOf("1")))
                    .build()
            )
    }

    @Test
    fun `should get projects with pipelines grouped by status`() {
        val groupId = 1L

        val pipelines = objectMapper.readValue(pipelinesJson, object : TypeReference<List<Pipeline>>() {})
        val pipelineSuccess = pipelines[0]
        val pipelineFailed = pipelines[1]

        `when`(gitlabFeignClient.getProjects(groupId = groupId))
            .thenReturn(objectMapper.readValue(projectsJson))

        `when`(gitlabFeignClient.getLatestPipeline(projectId = pipelineSuccess.projectId, ref = "master"))
            .thenReturn(pipelineSuccess)

        `when`(gitlabFeignClient.getLatestPipeline(projectId = pipelineFailed.projectId, ref = "master"))
            .thenReturn(pipelineFailed)

        val requestBuilder = get("/api/groups/${groupId}/projects")
            .accept(APPLICATION_JSON)
        val result = mvc.perform(requestBuilder)
            .andExpect(status().isOk)
            .andReturn()

        val projectsGroupedByStatus = objectMapper.readValue(
            result.response.contentAsString,
            object : TypeReference<Map<Pipeline.Status, List<ProjectWithLatestPipeline>>>() {}
        )

        verify(gitlabFeignClient, times(1)).getProjectsHead(anyLong(), anyInt())
        verify(gitlabFeignClient, times(1)).getProjects(anyLong(), anyInt(), anyInt())
        verify(gitlabFeignClient, times(2)).getLatestPipeline(anyLong(), anyString())

        assertThat(projectsGroupedByStatus.getValue(Pipeline.Status.SUCCESS)).satisfies(
            Consumer { list ->
                assertThat(list)
                    .hasSize(1)
                    .anySatisfy(
                        Consumer {
                            assertThat(it.pipeline).isEqualTo(pipelineSuccess)
                            assertThat(it.project.id).isEqualTo(1)
                            assertThat(it.project.defaultBranch).isEqualTo("master")
                            assertThat(it.project.name).isEqualTo("Project 1")
                            assertThat(it.project.topics).isEqualTo(setOf("Java"))
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
                            assertThat(it.project.id).isEqualTo(2)
                            assertThat(it.project.defaultBranch).isEqualTo("master")
                            assertThat(it.project.name).isEqualTo("Project 2")
                            assertThat(it.project.topics).isEqualTo(setOf("Kotlin"))
                        }
                    )
            }
        )
    }
}