package com.github.larscom.gitlabcidashboard

import org.springframework.boot.autoconfigure.SpringBootApplication
import org.springframework.boot.context.properties.ConfigurationPropertiesScan
import org.springframework.boot.runApplication

@SpringBootApplication
@ConfigurationPropertiesScan
class ApiApplication

fun main() {
    runApplication<ApiApplication>()
}
