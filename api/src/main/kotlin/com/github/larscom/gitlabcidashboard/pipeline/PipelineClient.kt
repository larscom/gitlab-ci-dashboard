package com.github.larscom.gitlabcidashboard.pipeline

import com.github.larscom.gitlabcidashboard.feign.GitlabFeignClient
import com.github.larscom.gitlabcidashboard.pipeline.model.Pipeline
import feign.FeignException
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Component

@Component
class PipelineClient(private val client: GitlabFeignClient) {

    companion object {
        private val LOG = LoggerFactory.getLogger(PipelineClient::class.java)
    }

    fun getPipelines(projectId: Long, ref: String): List<Pipeline> {
        return try {
            client.getPipelines(projectId = projectId, ref = ref)
        } catch (e: FeignException) {
            LOG.info("Did not get any Pipelines (projectId=$projectId, ref=$ref) from Gitlab API")
            listOf()
        }
    }

    fun getLatestPipeline(projectId: Long, ref: String): Pipeline? {
        return try {
            client.getLatestPipeline(projectId = projectId, ref = ref)
        } catch (e: FeignException) {
            LOG.info("Did not get latest Pipeline (projectId=$projectId, ref=$ref) from Gitlab API")
            null
        }
    }
}