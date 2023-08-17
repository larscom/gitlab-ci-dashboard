import { GroupId } from '$groups/model/group'
import { ProjectWithPipeline } from '$groups/model/pipeline'
import { Injectable } from '@angular/core'
import { Store, createState, withProps } from '@ngneat/elf'
import { excludeKeys, localStorageStrategy, persistState } from '@ngneat/elf-persist-state'
import {
  createRequestsStatusOperator,
  selectIsRequestPending,
  updateRequestStatus,
  withRequestsStatus
} from '@ngneat/elf-requests'
import { distinctUntilChanged, map } from 'rxjs'

interface State {
  projectsWithPipeline: ProjectWithPipeline[]

  filters: {
    [groupId: GroupId]: {
      project: string
      topics: string[]
    }
  }
}

const { state, config } = createState(
  withProps<State>({
    projectsWithPipeline: [],
    filters: Object()
  }),
  withRequestsStatus()
)

export const storeName = 'pipeline'
const store = new Store({ state, name: storeName, config })

persistState(store, {
  key: storeName,
  storage: localStorageStrategy,
  source: () => store.pipe(excludeKeys(['projectsWithPipeline', 'requestsStatus']))
})

export const trackRequestsStatus = createRequestsStatusOperator(store)
export const { initialState } = store

@Injectable({ providedIn: 'root' })
export class PipelineStore {
  readonly projectsWithPipeline$ = store.pipe(
    map(({ projectsWithPipeline }) => projectsWithPipeline),
    distinctUntilChanged()
  )
  readonly projectsLoading$ = store.pipe(selectIsRequestPending('getProjectsWithPipeline'), distinctUntilChanged())

  private readonly filters$ = store.pipe(
    map(({ filters }) => filters),
    distinctUntilChanged()
  )
  readonly topicsFilter = (groupId: GroupId) =>
    this.filters$.pipe(
      map((filters) => filters[groupId]?.topics || []),
      distinctUntilChanged()
    )
  readonly projectFilter = (groupId: GroupId) =>
    this.filters$.pipe(
      map((filters) => filters[groupId]?.project || ''),
      distinctUntilChanged()
    )

  setProjectFilter(groupId: GroupId, project: string): void {
    store.update((state) => {
      return {
        ...state,
        filters: {
          ...state.filters,
          [groupId]: {
            ...state.filters[groupId],
            project
          }
        }
      }
    })
  }

  setTopicsFilter(groupId: GroupId, topics: string[]): void {
    store.update((state) => {
      return {
        ...state,
        filters: {
          ...state.filters,
          [groupId]: {
            ...state.filters[groupId],
            topics
          }
        }
      }
    })
  }

  setProjectsWithPipeline(projectsWithPipeline: ProjectWithPipeline[]): void {
    store.update((state) => {
      return {
        ...state,
        projectsWithPipeline
      }
    }, updateRequestStatus('getProjectsWithPipeline', 'success'))
  }
}
