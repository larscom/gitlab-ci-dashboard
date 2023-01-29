package com.github.larscom.gitlabcidashboard.project

import com.adelean.inject.resources.junit.jupiter.GivenTextResource
import com.adelean.inject.resources.junit.jupiter.TestWithResources
import com.fasterxml.jackson.core.type.TypeReference
import com.fasterxml.jackson.databind.ObjectMapper
import com.fasterxml.jackson.module.kotlin.readValue
import com.github.larscom.gitlabcidashboard.createResponse
import com.github.larscom.gitlabcidashboard.feign.GitlabFeignClient
import com.github.larscom.gitlabcidashboard.pipeline.model.Pipeline
import com.github.larscom.gitlabcidashboard.project.model.ProjectWithLatestPipeline
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test
import org.mockito.ArgumentMatchers.anyInt
import org.mockito.ArgumentMatchers.anyLong
import org.mockito.ArgumentMatchers.anyString
import org.mockito.BDDMockito.given
import org.mockito.Mockito.times
import org.mockito.Mockito.verify
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.boot.test.mock.mockito.MockBean
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

    @GivenTextResource("/json/pipeline_failed.json")
    lateinit var pipelineFailedJson: String

    @GivenTextResource("/json/pipeline_success.json")
    lateinit var pipelineSuccessJson: String

    @Autowired
    lateinit var objectMapper: ObjectMapper

    @Autowired
    lateinit var mvc: MockMvc

    @MockBean
    lateinit var gitlabClient: GitlabFeignClient

    @Test
    fun `should get projects with pipelines grouped by status`() {
        val groupId = 61012723L

        val pipelineSuccess = objectMapper.readValue(pipelineSuccessJson, Pipeline::class.java)
        val pipelineFailed = objectMapper.readValue(pipelineFailedJson, Pipeline::class.java)

        given(gitlabClient.getProjectsHead(groupId = groupId))
            .willReturn(createResponse())

        given(gitlabClient.getProjects(groupId = groupId))
            .willReturn(objectMapper.readValue(projectsJson))

        given(gitlabClient.getLatestPipeline(projectId = pipelineSuccess.projectId, ref = "master"))
            .willReturn(pipelineSuccess)

        given(gitlabClient.getLatestPipeline(projectId = pipelineFailed.projectId, ref = "master"))
            .willReturn(pipelineFailed)

        val requestBuilder = get("/api/groups/${groupId}/projects")
            .accept(APPLICATION_JSON)
        val result = mvc.perform(requestBuilder)
            .andExpect(status().isOk)
            .andReturn()

        val projectsGroupedByStatus = objectMapper.readValue(
            result.response.contentAsString,
            object : TypeReference<Map<Pipeline.Status, List<ProjectWithLatestPipeline>>>() {}
        )

        verify(gitlabClient, times(1)).getProjectsHead(anyLong(), anyInt())
        verify(gitlabClient, times(1)).getProjects(anyLong(), anyInt(), anyInt())
        verify(gitlabClient, times(2)).getLatestPipeline(anyLong(), anyString())

        assertThat(projectsGroupedByStatus.keys).containsExactly(Pipeline.Status.FAILED, Pipeline.Status.SUCCESS)
        assertThat(projectsGroupedByStatus.getValue(Pipeline.Status.SUCCESS)).satisfies(
            Consumer { list ->
                assertThat(list)
                    .hasSize(1)
                    .anySatisfy(
                        Consumer {
                            assertThat(it.pipeline).isEqualTo(pipelineSuccess)
                            assertThat(it.project.id).isEqualTo(41540327)
                            assertThat(it.project.defaultBranch).isEqualTo("master")
                            assertThat(it.project.name).isEqualTo("go-project-1")
                            assertThat(it.project.topics).isEqualTo(setOf("go"))
                            assertThat(it.project.webUrl).isEqualTo("https://gitlab.com/go179/go-project-1")
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
                            assertThat(it.project.id).isEqualTo(41558380)
                            assertThat(it.project.defaultBranch).isEqualTo("master")
                            assertThat(it.project.name).isEqualTo("go-project-2")
                            assertThat(it.project.topics).isEmpty()
                            assertThat(it.project.webUrl).isEqualTo("https://gitlab.com/go179/go-project-2")
                        }
                    )
            }
        )
    }
}