package com.github.larscom.gitlabcidashboard.version

import org.springframework.beans.factory.annotation.Value
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

@RequestMapping("/api/version")
@RestController
class VersionController {

    @GetMapping
    fun getVersion(@Value("\${app.version}") version: String) = version
}
