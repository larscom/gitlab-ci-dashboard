package com.github.larscom.gitlabcidashboard.group

import com.github.larscom.gitlabcidashboard.createResponse
import com.github.larscom.gitlabcidashboard.feign.GitlabFeignClient
import com.github.larscom.gitlabcidashboard.group.model.Group
import feign.FeignException
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.AfterEach
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.extension.ExtendWith
import org.mockito.ArgumentMatchers.any
import org.mockito.ArgumentMatchers.anyInt
import org.mockito.BDDMockito.given
import org.mockito.InjectMocks
import org.mockito.Mock
import org.mockito.Mockito.mock
import org.mockito.Mockito.never
import org.mockito.Mockito.verify
import org.mockito.Mockito.verifyNoMoreInteractions
import org.mockito.junit.jupiter.MockitoExtension

@ExtendWith(MockitoExtension::class)
class GroupClientTest {

    @Mock
    private lateinit var gitlabFeignClient: GitlabFeignClient

    @InjectMocks
    private lateinit var groupClient: GroupClient

    @AfterEach
    fun afterEach() {
        verifyNoMoreInteractions(gitlabFeignClient)
    }

    @Test
    fun `should return empty list when total pages is 0`() {
        given(gitlabFeignClient.getGroupsHead(any(), anyInt())).willReturn(createResponse(totalPages = 0))

        assertThat(groupClient.getGroups()).isEmpty()
    }

    @Test
    fun `should merge groups from all pages`() {
        val page1Groups = listOf(
            mock(Group::class.java),
            mock(Group::class.java),
            mock(Group::class.java)
        )
        val page2Groups = listOf(mock(Group::class.java), mock(Group::class.java))

        given(gitlabFeignClient.getGroupsHead(any(), anyInt())).willReturn(createResponse(totalPages = 2))

        given(gitlabFeignClient.getGroups(page = 1)).willReturn(page1Groups)
        given(gitlabFeignClient.getGroups(page = 2)).willReturn(page2Groups)

        assertThat(groupClient.getGroups()).isEqualTo(page1Groups.plus(page2Groups))
    }

    @Test
    fun `should merge groups from all pages even if one request fails`() {
        val page1Groups = listOf(
            mock(Group::class.java),
            mock(Group::class.java),
            mock(Group::class.java)
        )
        val page3Groups = listOf(mock(Group::class.java), mock(Group::class.java))

        given(gitlabFeignClient.getGroupsHead(any(), anyInt())).willReturn(createResponse(totalPages = 3))

        given(gitlabFeignClient.getGroups(page = 1)).willReturn(page1Groups)
        given(gitlabFeignClient.getGroups(page = 2)).willThrow(
            FeignException.InternalServerError(
                "ERROR!", mock(feign.Request::class.java), byteArrayOf(), mapOf()
            )
        )
        given(gitlabFeignClient.getGroups(page = 3)).willReturn(page3Groups)

        assertThat(groupClient.getGroups()).isEqualTo(page1Groups.plus(page3Groups))
    }

    @Test
    fun `should get groups with id and filter out null`() {
        val group1 = mock(Group::class.java)
        val group2 = mock(Group::class.java)

        given(gitlabFeignClient.getGroup(groupId = 1)).willReturn(group1)
        given(gitlabFeignClient.getGroup(groupId = 2)).willReturn(group2)
        given(gitlabFeignClient.getGroup(groupId = 3)).willReturn(null)

        assertThat(groupClient.getGroupsWithId(groupIds = listOf(1, 2, 3))).isEqualTo(listOf(group1, group2))

        verify(gitlabFeignClient, never()).getGroupsHead(any(), anyInt())
    }

    @Test
    fun `should get groups with id even if one request fails`() {
        val group1 = mock(Group::class.java)
        val group3 = mock(Group::class.java)

        given(gitlabFeignClient.getGroup(groupId = 1)).willReturn(group1)
        given(gitlabFeignClient.getGroup(groupId = 2)).willThrow(
            FeignException.InternalServerError(
                "ERROR!", mock(feign.Request::class.java), byteArrayOf(), mapOf()
            )
        )
        given(gitlabFeignClient.getGroup(groupId = 3)).willReturn(group3)

        assertThat(groupClient.getGroupsWithId(groupIds = listOf(1, 2, 3))).isEqualTo(listOf(group1, group3))

        verify(gitlabFeignClient, never()).getGroupsHead(any(), anyInt())
    }
}