package com.github.larscom.gitlabcidashboard.feign

import com.github.larscom.gitlabcidashboard.branch.model.Branch
import com.github.larscom.gitlabcidashboard.group.model.Group
import com.github.larscom.gitlabcidashboard.pipeline.model.Pipeline
import com.github.larscom.gitlabcidashboard.project.model.Project
import org.springframework.cloud.openfeign.FeignClient
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestMethod

@FeignClient(value = "gitlab", url = "\${gitlab.base_url}/api/v4", decode404 = true)
interface GitlabFeignClient {

    @RequestMapping(method = [RequestMethod.HEAD], value = ["/groups?per_page={perPage}&skip_groups={skipGroups}"])
    fun getGroupsHead(
        @PathVariable("skipGroups") skipGroups: String? = null,
        @PathVariable("perPage") perPage: Int = 100
    ): feign.Response

    @RequestMapping(
        method = [RequestMethod.GET],
        value = ["/groups?page={page}&per_page={perPage}&skip_groups={skipGroups}"]
    )
    fun getGroups(
        @PathVariable("skipGroups") skipGroups: String? = null,
        @PathVariable("page") page: Int = 1,
        @PathVariable("perPage") perPage: Int = 100
    ): List<Group>

    @RequestMapping(method = [RequestMethod.GET], value = ["/groups/{groupId}?with_projects=false"])
    fun getGroup(@PathVariable("groupId") groupId: Long): Group?

    @RequestMapping(
        method = [RequestMethod.HEAD],
        value = ["/groups/{groupId}/projects?per_page={perPage}&archived=false"]
    )
    fun getProjectsHead(
        @PathVariable("groupId") groupId: Long,
        @PathVariable("perPage") perPage: Int = 100
    ): feign.Response

    @RequestMapping(
        method = [RequestMethod.GET],
        value = ["/groups/{groupId}/projects?page={page}&per_page={perPage}&archived=false"]
    )
    fun getProjects(
        @PathVariable("groupId") groupId: Long,
        @PathVariable("page") page: Int = 1,
        @PathVariable("perPage") perPage: Int = 100
    ): List<Project>

    @RequestMapping(
        method = [RequestMethod.HEAD],
        value = ["/projects/{projectId}/pipelines?per_page={perPage}&ref={ref}"]
    )
    fun getPipelinesHead(
        @PathVariable("projectId") projectId: Long,
        @PathVariable("ref") ref: String,
        @PathVariable("perPage") perPage: Int = 100
    ): feign.Response

    @RequestMapping(
        method = [RequestMethod.GET],
        value = ["/projects/{projectId}/pipelines?page={page}&per_page={perPage}&ref={ref}"]
    )
    fun getPipelines(
        @PathVariable("projectId") projectId: Long,
        @PathVariable("ref") ref: String,
        @PathVariable("page") page: Int = 1,
        @PathVariable("perPage") perPage: Int = 100
    ): List<Pipeline>

    @RequestMapping(method = [RequestMethod.GET], value = ["/projects/{projectId}/pipelines/latest?ref={ref}"])
    fun getLatestPipeline(
        @PathVariable("projectId") projectId: Long,
        @PathVariable("ref") ref: String
    ): Pipeline?

    @RequestMapping(
        method = [RequestMethod.HEAD],
        value = ["/projects/{projectId}/repository/branches?per_page={perPage}"]
    )
    fun getBranchesHead(
        @PathVariable("projectId") projectId: Long,
        @PathVariable("perPage") perPage: Int = 100
    ): feign.Response

    @RequestMapping(
        method = [RequestMethod.GET],
        value = ["/projects/{projectId}/repository/branches?page={page}&per_page={perPage}"]
    )
    fun getBranches(
        @PathVariable("projectId") projectId: Long,
        @PathVariable("page") page: Int = 1,
        @PathVariable("perPage") perPage: Int = 100
    ): List<Branch>
}
