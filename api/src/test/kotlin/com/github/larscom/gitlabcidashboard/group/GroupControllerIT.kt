package com.github.larscom.gitlabcidashboard.group

import com.adelean.inject.resources.junit.jupiter.GivenTextResource
import com.adelean.inject.resources.junit.jupiter.TestWithResources
import com.fasterxml.jackson.core.type.TypeReference
import com.fasterxml.jackson.databind.ObjectMapper
import com.fasterxml.jackson.module.kotlin.readValue
import com.github.larscom.gitlabcidashboard.createResponse
import com.github.larscom.gitlabcidashboard.feign.GitlabFeignClient
import com.github.larscom.gitlabcidashboard.group.model.Group
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test
import org.mockito.ArgumentMatchers.any
import org.mockito.ArgumentMatchers.anyInt
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
class GroupControllerIT {

    @GivenTextResource("/json/groups.json")
    lateinit var groupsJson: String

    @Autowired
    lateinit var objectMapper: ObjectMapper

    @Autowired
    lateinit var mvc: MockMvc

    @MockBean
    lateinit var gitlabClient: GitlabFeignClient

    @Test
    fun `should get groups`() {
        given(gitlabClient.getGroupsHead()).willReturn(createResponse())
        given(gitlabClient.getGroups()).willReturn(objectMapper.readValue(groupsJson))

        val requestBuilder = get("/api/groups")
            .accept(APPLICATION_JSON)
        val result = mvc.perform(requestBuilder)
            .andExpect(status().isOk)
            .andReturn()

        val groups = objectMapper.readValue(
            result.response.contentAsString,
            object : TypeReference<List<Group>>() {}
        )

        verify(gitlabClient, times(1)).getGroupsHead(any(), anyInt())
        verify(gitlabClient, times(1)).getGroups(any(), anyInt(), anyInt())

        assertThat(groups).hasSize(5)
            .anyMatch { it.id == 61012723L }
            .anyMatch { it.id == 61000803L }
            .anyMatch { it.id == 61000947L }
            .anyMatch { it.id == 61000918L }
            .anyMatch { it.id == 61000976L }
    }
}