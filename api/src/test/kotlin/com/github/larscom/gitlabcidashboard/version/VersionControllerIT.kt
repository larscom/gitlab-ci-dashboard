package com.github.larscom.gitlabcidashboard.version

import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.http.MediaType.APPLICATION_JSON
import org.springframework.test.context.ActiveProfiles
import org.springframework.test.web.servlet.MockMvc
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.status

@SpringBootTest
@ActiveProfiles("test")
@AutoConfigureMockMvc
class VersionControllerIT {

    @Autowired
    lateinit var mvc: MockMvc

    @Test
    fun `should get version`() {
        val requestBuilder = get("/api/version")
            .accept(APPLICATION_JSON)
        val result = mvc.perform(requestBuilder)
            .andExpect(status().isOk)
            .andReturn()

        val version = result.response.contentAsString
        assertThat(version).isEqualTo("123")
    }
}