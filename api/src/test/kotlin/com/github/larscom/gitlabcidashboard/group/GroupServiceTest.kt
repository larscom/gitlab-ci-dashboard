package com.github.larscom.gitlabcidashboard.group

import com.github.larscom.gitlabcidashboard.group.model.Group
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.AfterEach
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.extension.ExtendWith
import org.mockito.BDDMockito.given
import org.mockito.BDDMockito.verifyNoMoreInteractions
import org.mockito.Mock
import org.mockito.Mockito.mock
import org.mockito.junit.jupiter.MockitoExtension

@ExtendWith(MockitoExtension::class)
class GroupServiceTest {

    @Mock
    private lateinit var groupClient: GroupClient

    private lateinit var groupService: GroupService

    @BeforeEach
    fun beforeEach() {
        groupService = GroupService(
            groupClient = groupClient,
            listOf(),
            listOf()
        )
    }

    @AfterEach
    fun afterEach() {
        verifyNoMoreInteractions(groupClient)
    }

    @Test
    fun `should get all groups by default`() {
        val groups = listOf(mock(Group::class.java))

        given(groupClient.getGroups()).willReturn(groups)

        assertThat(groupService.getGroups()).isEqualTo(groups)
    }

    @Test
    fun `should get groups with ids`() {
        val groups = listOf(mock(Group::class.java))
        val onlyGroupIds = listOf(1L, 2L)

        groupService = GroupService(
            groupClient = groupClient,
            onlyGroupIds = onlyGroupIds,
            skipGroupIds = listOf()
        )

        given(groupClient.getGroupsWithId(groupIds = onlyGroupIds)).willReturn(groups)

        assertThat(groupService.getGroups()).isEqualTo(groups)
    }

    @Test
    fun `should skip groups with ids`() {
        val groups = listOf(mock(Group::class.java))
        val skipGroupIds = listOf(1L, 2L)

        groupService = GroupService(
            groupClient = groupClient,
            onlyGroupIds = listOf(),
            skipGroupIds = skipGroupIds
        )

        given(groupClient.getGroups(skipIds = skipGroupIds)).willReturn(groups)

        assertThat(groupService.getGroups()).isEqualTo(groups)
    }

    @Test
    fun `should sort by name when onlyGroupIds is provided`() {
        val groups = listOf(
            Group(id = 3, name = "c"), Group(id = 2, name = "a"),
            Group(id = 1, name = "b")
        )
        val onlyGroupIds = groups.map { it.id }

        groupService = GroupService(
            groupClient = groupClient,
            onlyGroupIds = onlyGroupIds,
            skipGroupIds = listOf()
        )

        given(groupClient.getGroupsWithId(groupIds = onlyGroupIds)).willReturn(groups)

        assertThat(groupService.getGroups()).isSortedAccordingTo(Comparator.comparing(Group::name))
    }

    @Test
    fun `should sort by name`() {
        val groups = listOf(
            Group(id = 3, name = "c"), Group(id = 2, name = "a"),
            Group(id = 1, name = "b")
        )

        groupService = GroupService(
            groupClient = groupClient,
            onlyGroupIds = listOf(),
            skipGroupIds = listOf()
        )

        given(groupClient.getGroups()).willReturn(groups)

        assertThat(groupService.getGroups()).isSortedAccordingTo(Comparator.comparing(Group::name))
    }

    @Test
    fun `should sort by name when skipGroupIds is provided`() {
        val groups = listOf(
            Group(id = 3, name = "c"), Group(id = 2, name = "a"),
            Group(id = 1, name = "b")
        )

        val skipGroupIds = listOf(1L)

        groupService = GroupService(
            groupClient = groupClient,
            onlyGroupIds = listOf(),
            skipGroupIds = skipGroupIds
        )

        given(groupClient.getGroups(skipIds = skipGroupIds)).willReturn(groups)

        assertThat(groupService.getGroups()).isSortedAccordingTo(Comparator.comparing(Group::name))
    }
}