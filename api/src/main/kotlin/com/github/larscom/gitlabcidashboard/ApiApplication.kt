package com.github.larscom.gitlabcidashboard

import org.springframework.boot.autoconfigure.SpringBootApplication
import org.springframework.boot.runApplication
import org.springframework.cloud.openfeign.EnableFeignClients

@SpringBootApplication
@EnableFeignClients
class ApiApplication

fun main() {
    runApplication<ApiApplication>()
}
