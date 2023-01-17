package com.github.larscom.gitlabcidashboard.feign.extension

import feign.Request
import feign.Request.HttpMethod.HEAD
import feign.Response
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test
import org.springframework.http.HttpStatus.BAD_REQUEST
import org.springframework.http.HttpStatus.OK

class ResponseExtensionTest {

    @Test
    fun `should successfully get total pages when response is OK`() {
        val totalPages = Response.builder()
            .request(Request.create(HEAD, "url", mapOf(), null, null, null))
            .status(OK.value())
            .headers(mapOf("x-total-pages" to listOf("10")))
            .build()
            .toTotalPages()

        assertThat(totalPages).isEqualTo(10)
    }

    @Test
    fun `should not get total pages when there is a bad request`() {
        val totalPages = Response.builder()
            .request(Request.create(HEAD, "url", mapOf(), null, null, null))
            .status(BAD_REQUEST.value())
            .headers(mapOf("x-total-pages" to listOf("10")))
            .build()
            .toTotalPages()

        assertThat(totalPages).isNull()
    }

    @Test
    fun `should not fail if header x-total-pages is missing`() {
        val totalPages = Response.builder()
            .request(Request.create(HEAD, "url", mapOf(), null, null, null))
            .status(OK.value())
            .build()
            .toTotalPages()

        assertThat(totalPages).isNull()
    }
}