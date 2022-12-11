import { Status } from '@app/core/models/pipeline'
import { ProjectWithLatestPipeline } from '@app/core/models/project-with-pipeline'
import { Injectable } from '@angular/core'
import { createState, select, Store, withProps } from '@ngneat/elf'
import {
  createRequestsStatusOperator,
  selectRequestStatus,
  updateRequestStatus,
  withRequestsStatus,
} from '@ngneat/elf-requests'
import { map } from 'rxjs'

export interface ProjectState {
  readonly projects: Record<Status, ProjectWithLatestPipeline[]>
  readonly filterText: string
  readonly filterTopics: string[]
}

const { state, config } = createState(
  withProps<ProjectState>({
    projects: Object(),
    filterText: '',
    filterTopics: [],
  }),
  withRequestsStatus()
)

const projectStore = new Store({ state, name: 'project', config })

export const trackRequestsStatus = createRequestsStatusOperator(projectStore)
export const initialState = projectStore.initialState

@Injectable()
export class ProjectStore {
  readonly projects$ = projectStore.pipe(select(({ projects }) => projects))
  readonly projectsLoading$ = projectStore.pipe(
    selectRequestStatus('projects'),
    map(({ value }) => value === 'pending')
  )

  readonly filterText$ = projectStore.pipe(
    select(({ filterText }) => filterText)
  )
  readonly filterTopics$ = projectStore.pipe(
    select(({ filterTopics }) => filterTopics)
  )

  setProjects(projects: Record<Status, ProjectWithLatestPipeline[]>): void {
    projectStore.update(
      (state) => ({ ...state, projects }),
      updateRequestStatus('projects', 'success')
    )
  }

  setFilterText(filterText: string): void {
    projectStore.update((state) => ({ ...state, filterText }))
  }

  setFilterTopics(filterTopics: string[]): void {
    projectStore.update((state) => ({ ...state, filterTopics }))
  }
}
