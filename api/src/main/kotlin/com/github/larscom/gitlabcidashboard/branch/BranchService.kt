package com.github.larscom.gitlabcidashboard.branch

import com.github.larscom.gitlabcidashboard.branch.model.Branch
import com.github.larscom.gitlabcidashboard.branch.model.BranchPipeline
import com.github.larscom.gitlabcidashboard.pipeline.PipelineKey
import com.github.larscom.gitlabcidashboard.pipeline.PipelineLatestRepository
import io.micrometer.core.annotation.Timed
import kotlinx.coroutines.Dispatchers.IO
import kotlinx.coroutines.async
import kotlinx.coroutines.awaitAll
import kotlinx.coroutines.coroutineScope
import kotlinx.coroutines.runBlocking
import org.springframework.stereotype.Service

@Service
class BranchService(
    private val branchRepository: BranchRepository,
    private val pipelineLatestRepository: PipelineLatestRepository
) {

    @Timed(value = "service.get.branches.with-latest-pipeline", description = "Time taken to return all branches including latest pipeline")
    fun getBranchesWithLatestPipeline(projectId: Long): List<BranchPipeline> = runBlocking(IO) {
        getBranchesWithLatestPipeline(projectId = projectId, branches = branchRepository.get(projectId))
    }

    private suspend fun getBranchesWithLatestPipeline(projectId: Long, branches: List<Branch>) = coroutineScope {
        branches.map {
            async {
                BranchPipeline(
                    branch = it,
                    pipeline = pipelineLatestRepository.get(PipelineKey(projectId = projectId, ref = it.name))
                )
            }
        }.awaitAll()
    }
}
