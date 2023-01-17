package com.github.larscom.gitlabcidashboard

import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.test.context.ActiveProfiles

@SpringBootTest
@ActiveProfiles("test")
class StartupIT {

    @Autowired
    private lateinit var application: ApiApplication

    @Test
    fun startup() {
        assertThat(application).isNotNull
    }
}
