package com.github.larscom.gitlabcidashboard.pipeline

import com.github.larscom.gitlabcidashboard.feign.GitlabFeignClient
import com.github.larscom.gitlabcidashboard.pipeline.model.Pipeline
import feign.FeignException
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Component

@Component
class PipelineClient(private val gitlabClient: GitlabFeignClient) {

    companion object {
        private val LOG = LoggerFactory.getLogger(PipelineClient::class.java)
    }

    fun getPipelines(projectId: Long, ref: String): List<Pipeline> {
        return try {
            gitlabClient.getPipelines(projectId = projectId, ref = ref)
        } catch (e: FeignException) {
            LOG.info("Did not find any Pipelines (projectId=$projectId, ref=$ref)")
            listOf()
        }
    }

    fun getLatestPipeline(projectId: Long, ref: String): Pipeline? {
        return try {
            gitlabClient.getLatestPipeline(projectId = projectId, ref = ref)
        } catch (e: FeignException) {
            LOG.info("Did not find latest Pipeline (projectId=$projectId, ref=$ref)")
            null
        }
    }
}