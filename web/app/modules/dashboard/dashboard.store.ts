import { Injectable } from '@angular/core'
import { createState, select, Store, withProps } from '@ngneat/elf'
import {
  createRequestsStatusOperator,
  selectRequestStatus,
  updateRequestStatus,
  withRequestsStatus,
} from '@ngneat/elf-requests'
import { map } from 'rxjs'
import { Group, GroupId } from './models/group'
import { ProjectWithPipelines } from './models/project-with-pipelines'

export interface DashboardState {
  groups: Group[]
  projects: Record<GroupId, ProjectWithPipelines[]>
}

const { state, config } = createState(
  withProps<DashboardState>({ groups: [], projects: {} }),
  withRequestsStatus()
)

const dashboardStore = new Store({ state, name: 'dashboard', config })

export const trackRequestsStatus = createRequestsStatusOperator(dashboardStore)
export const initialState = dashboardStore.initialState

@Injectable()
export class DashboardStore {
  readonly groups$ = dashboardStore.pipe(select(({ groups }) => groups))
  readonly groupsLoading$ = dashboardStore.pipe(
    selectRequestStatus('groups'),
    map(({ value }) => value === 'pending')
  )

  readonly projects$ = dashboardStore.pipe(select(({ projects }) => projects))
  readonly projectsLoading$ = dashboardStore.pipe(
    selectRequestStatus('projects'),
    map(({ value }) => value === 'pending')
  )

  updateGroups(groups: Group[]): void {
    console.info('??')
    dashboardStore.update(
      (state) => ({ ...state, groups }),
      updateRequestStatus('groups', 'success')
    )
  }

  updateProjects(groupId: GroupId, projects: ProjectWithPipelines[]): void {
    dashboardStore.update(
      (state) => ({
        ...state,
        projects: {
          ...state.projects,
          [groupId]: projects,
        },
      }),
      updateRequestStatus('projects', 'success')
    )
  }
}
