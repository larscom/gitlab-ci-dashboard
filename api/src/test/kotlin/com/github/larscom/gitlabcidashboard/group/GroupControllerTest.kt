package com.github.larscom.gitlabcidashboard.group

import com.github.larscom.gitlabcidashboard.group.model.Group
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.AfterEach
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.extension.ExtendWith
import org.mockito.BDDMockito.given
import org.mockito.BDDMockito.verifyNoMoreInteractions
import org.mockito.InjectMocks
import org.mockito.Mock
import org.mockito.Mockito.mock
import org.mockito.junit.jupiter.MockitoExtension

@ExtendWith(MockitoExtension::class)
class GroupControllerTest {

    @Mock
    private lateinit var groupService: GroupService

    @InjectMocks
    private lateinit var groupController: GroupController

    @AfterEach
    fun afterEach() {
        verifyNoMoreInteractions(groupService)
    }

    @Test
    fun `should get groups`() {
        val groups = listOf(mock(Group::class.java))

        given(groupService.getGroups()).willReturn(groups)

        assertThat(groupController.getGroups()).isEqualTo(groups)
    }
}