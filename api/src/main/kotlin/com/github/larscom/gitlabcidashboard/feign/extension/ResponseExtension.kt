package com.github.larscom.gitlabcidashboard.feign.extension

import org.springframework.http.HttpStatus.OK

fun feign.Response.toTotalPages(): Int? = this.takeIf { it.status() == OK.value() }
    ?.headers()
    ?.getOrElse("x-total-pages") { null }
    ?.firstOrNull()
    ?.takeIf { it.isNotBlank() }
    ?.toInt()
    ?.takeIf { it > 0 }
