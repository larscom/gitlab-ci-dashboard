package com.github.larscom.gitlabcidashboard.branch

import com.adelean.inject.resources.junit.jupiter.GivenTextResource
import com.adelean.inject.resources.junit.jupiter.TestWithResources
import com.fasterxml.jackson.core.type.TypeReference
import com.fasterxml.jackson.databind.ObjectMapper
import com.fasterxml.jackson.module.kotlin.readValue
import com.github.larscom.gitlabcidashboard.branch.model.Branch
import com.github.larscom.gitlabcidashboard.createResponse
import com.github.larscom.gitlabcidashboard.feign.GitlabFeignClient
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

@TestWithResources
@AutoConfigureMockMvc
@ActiveProfiles("test")
@SpringBootTest
class BranchControllerIT {

    @GivenTextResource("/json/branches.json")
    lateinit var branchesJson: String

    @Autowired
    lateinit var objectMapper: ObjectMapper

    @Autowired
    lateinit var mvc: MockMvc

    @MockBean
    lateinit var gitlabClient: GitlabFeignClient

    @Test
    fun `should get branches for project`() {
        val projectId = 1L
        given(gitlabClient.getBranchesHead(projectId = projectId)).willReturn(createResponse())
        given(gitlabClient.getBranches(projectId = projectId)).willReturn(objectMapper.readValue(branchesJson))

        val requestBuilder = get("/api/branches/$projectId")
            .accept(APPLICATION_JSON)
        val result = mvc.perform(requestBuilder)
            .andExpect(status().isOk)
            .andReturn()

        val branches = objectMapper.readValue(
            result.response.contentAsString,
            object : TypeReference<List<Branch>>() {}
        )

        verify(gitlabClient, times(1)).getBranchesHead(anyLong(), anyInt())
        verify(gitlabClient, times(1)).getBranches(anyLong(), anyInt(), anyInt())

        assertThat(branches).hasSize(2)
            .anyMatch { it.name == "feature-1" }
            .anyMatch { it.name == "feature-2" }
    }
}