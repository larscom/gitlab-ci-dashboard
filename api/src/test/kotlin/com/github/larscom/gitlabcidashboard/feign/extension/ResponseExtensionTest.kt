package com.github.larscom.gitlabcidashboard.feign.extension

import feign.Request
import feign.Response
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test
import org.mockito.Mockito.mock
import org.springframework.http.HttpStatus.BAD_REQUEST
import org.springframework.http.HttpStatus.OK

class ResponseExtensionTest {

    @Test
    fun `should successfully get total pages when response is OK`() {
        val totalPages = Response.builder()
            .request(mock(Request::class.java))
            .status(OK.value())
            .headers(mapOf("x-total-pages" to listOf("10")))
            .build()
            .toTotalPages()

        assertThat(totalPages).isEqualTo(10)
    }

    @Test
    fun `should return null when there is a bad request`() {
        val totalPages = Response.builder()
            .request(mock(Request::class.java))
            .status(BAD_REQUEST.value())
            .headers(mapOf("x-total-pages" to listOf("10")))
            .build()
            .toTotalPages()

        assertThat(totalPages).isNull()
    }

    @Test
    fun `should return null if header x-total-pages is missing`() {
        val totalPages = Response.builder()
            .request(mock(Request::class.java))
            .status(OK.value())
            .build()
            .toTotalPages()

        assertThat(totalPages).isNull()
    }

    @Test
    fun `should return null if header x-total-pages is 0`() {
        val totalPages = Response.builder()
            .request(mock(Request::class.java))
            .status(OK.value())
            .headers(mapOf("x-total-pages" to listOf("0")))
            .build()
            .toTotalPages()

        assertThat(totalPages).isNull()
    }
}