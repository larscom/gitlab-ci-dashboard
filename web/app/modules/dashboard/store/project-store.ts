import { filterBy } from '@/app/shared/util/filters'
import { Injectable } from '@angular/core'
import { createState, select, Store, withProps } from '@ngneat/elf'
import {
  createRequestsStatusOperator,
  selectRequestStatus,
  updateRequestStatus,
  withRequestsStatus,
} from '@ngneat/elf-requests'
import { map, Observable, withLatestFrom } from 'rxjs'
import { Status } from '../models/pipeline'
import { ProjectWithLatestPipeline } from '../models/project-with-pipeline'

export interface ProjectState {
  readonly projects: Record<Status, ProjectWithLatestPipeline[]>
  readonly query: string
}

const { state, config } = createState(
  withProps<ProjectState>({ projects: Object(), query: '' }),
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

  readonly foundProjects$: Observable<
    Record<Status, ProjectWithLatestPipeline[]>
  > = projectStore.pipe(
    select(({ query }) => query),
    withLatestFrom(this.projects$),
    map(([query, all]) => {
      return Object.keys(all).reduce((result, key) => {
        const projects = Object(all)[key] as ProjectWithLatestPipeline[]
        return {
          ...result,
          [key]: projects.filter(({ project: { name } }) =>
            filterBy(name, query)
          ),
        }
      }, {} as Record<Status, ProjectWithLatestPipeline[]>)
    })
  )

  update(projects: Record<Status, ProjectWithLatestPipeline[]>): void {
    projectStore.update(
      (state) => ({ ...state, projects }),
      updateRequestStatus('projects', 'success')
    )
  }

  search(query: string): void {
    projectStore.update((state) => ({ ...state, query }))
  }
}
