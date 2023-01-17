package com.github.larscom.gitlabcidashboard.feign.extension

import org.springframework.http.HttpStatus

fun feign.Response.toTotalPages(): Int? = this.takeIf { it.status() == HttpStatus.OK.value() }
    ?.headers()
    ?.getOrElse("x-total-pages") { null }
    ?.firstOrNull()
    ?.takeIf { it.isNotBlank() }
    ?.toInt()
