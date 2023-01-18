package com.github.larscom.gitlabcidashboard.group

import com.github.larscom.gitlabcidashboard.createResponse
import com.github.larscom.gitlabcidashboard.feign.GitlabFeignClient
import com.github.larscom.gitlabcidashboard.group.model.Group
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.AfterEach
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.extension.ExtendWith
import org.mockito.ArgumentMatchers.anyInt
import org.mockito.ArgumentMatchers.anyString
import org.mockito.BDDMockito.given
import org.mockito.InjectMocks
import org.mockito.Mock
import org.mockito.Mockito.mock
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
        given(gitlabFeignClient.getGroupsHead(anyString(), anyInt())).willReturn(createResponse(totalPages = 0))

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

        given(gitlabFeignClient.getGroupsHead(anyString(), anyInt())).willReturn(createResponse(totalPages = 2))

        given(gitlabFeignClient.getGroups(skipGroups = "", page = 1)).willReturn(page1Groups)
        given(gitlabFeignClient.getGroups(skipGroups = "", page = 2)).willReturn(page2Groups)

        assertThat(groupClient.getGroups()).isEqualTo(page1Groups.plus(page2Groups))
    }
}