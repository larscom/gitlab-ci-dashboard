package com.github.larscom.gitlabcidashboard.pipeline

import com.github.larscom.gitlabcidashboard.pipeline.model.Pipeline
import org.springframework.http.MediaType
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

@RequestMapping("/api/pipelines/{projectId}/{ref}", produces = [MediaType.APPLICATION_JSON_VALUE])
@RestController
class PipelineController(
    private val pipelineLatestRepository: PipelineLatestRepository
) {

    @GetMapping("/latest")
    fun getLatestPipeline(
        @PathVariable("projectId") projectId: Long,
        @PathVariable("ref") ref: String
    ): Pipeline? = pipelineLatestRepository.get(PipelineKey(projectId, ref))
}