package com.github.larscom.gitlabcidashboard.branch

import com.adelean.inject.resources.junit.jupiter.GivenTextResource
import com.adelean.inject.resources.junit.jupiter.TestWithResources
import com.fasterxml.jackson.core.type.TypeReference
import com.fasterxml.jackson.databind.ObjectMapper
import com.fasterxml.jackson.module.kotlin.readValue
import com.github.larscom.gitlabcidashboard.branch.model.BranchPipeline
import com.github.larscom.gitlabcidashboard.createResponse
import com.github.larscom.gitlabcidashboard.feign.GitlabFeignClient
import com.github.larscom.gitlabcidashboard.pipeline.model.Pipeline
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test
import org.mockito.ArgumentMatchers.anyInt
import org.mockito.ArgumentMatchers.anyLong
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
import java.time.Instant
import java.util.function.Consumer

@TestWithResources
@AutoConfigureMockMvc
@ActiveProfiles("test")
@SpringBootTest
class BranchControllerIT {

    @GivenTextResource("/json/branches.json")
    lateinit var branchesJson: String

    @GivenTextResource("/json/pipeline_success.json")
    lateinit var pipelineSuccessJson: String

    @Autowired
    lateinit var objectMapper: ObjectMapper

    @Autowired
    lateinit var mvc: MockMvc

    @MockBean
    lateinit var gitlabClient: GitlabFeignClient

    @Test
    fun `should get branches with latest pipelines for project`() {
        val projectId = 1L
        given(gitlabClient.getBranchesHead(projectId = projectId)).willReturn(createResponse())
        given(gitlabClient.getBranches(projectId = projectId)).willReturn(objectMapper.readValue(branchesJson))

        given(
            gitlabClient.getLatestPipeline(
                projectId = projectId,
                ref = "feature-1"
            )
        ).willReturn(objectMapper.readValue(pipelineSuccessJson))

        val requestBuilder = get("/api/branches/$projectId")
            .accept(APPLICATION_JSON)
        val result = mvc.perform(requestBuilder)
            .andExpect(status().isOk)
            .andReturn()

        val branchesWithLatestPipelines = objectMapper.readValue(
            result.response.contentAsString,
            object : TypeReference<List<BranchPipeline>>() {}
        )

        verify(gitlabClient, times(1)).getBranchesHead(anyLong(), anyInt())
        verify(gitlabClient, times(1)).getBranches(anyLong(), anyInt(), anyInt())

        assertThat(branchesWithLatestPipelines)
            .hasSize(2)
            .anySatisfy(
                Consumer { value ->
                    assertThat(value.branch).satisfies(
                        Consumer { branch ->
                            assertThat(branch.name).isEqualTo("feature-1")
                            assertThat(branch.webUrl).isEqualTo("https://gitlab.com/java676/java-project-3/-/tree/feature-1")
                            assertThat(branch.canPush).isTrue
                            assertThat(branch.default).isFalse
                            assertThat(branch.merged).isFalse
                            assertThat(branch.protected).isFalse
                            assertThat(branch.commit).satisfies(
                                Consumer { commit ->
                                    assertThat(commit.id).isEqualTo("467a826f9ccb94dad7d7d9f2aaac80b93f64096d")
                                    assertThat(commit.committedDate).isEqualTo(Instant.parse("2022-12-02T18:56:49.000+00:00"))
                                    assertThat(commit.authorName).isEqualTo("Gitlab CI Dashboard")
                                    assertThat(commit.message).isEqualTo("Update .gitlab-ci.yml")
                                    assertThat(commit.title).isEqualTo("Update .gitlab-ci.yml")
                                    assertThat(commit.committerName).isEqualTo("Gitlab CI Dashboard")
                                }
                            )
                        }
                    )
                    assertThat(value.pipeline).satisfies(
                        Consumer { pipeline ->
                            assertThat(pipeline?.status).isEqualTo(Pipeline.Status.SUCCESS)
                        }
                    )
                }
            )
    }
}