package com.github.larscom.gitlabcidashboard

import feign.Request
import feign.Response
import org.mockito.Mockito.mock
import org.springframework.http.HttpStatus

fun createResponse(status: HttpStatus = HttpStatus.OK, totalPages: Int = 1): Response = Response.builder()
    .request(mock(Request::class.java))
    .status(status.value())
    .headers(mapOf("x-total-pages" to listOf(totalPages.toString())))
    .build()