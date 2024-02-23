import { GroupId } from '$groups/model/group'
import { PipelineId, ProjectPipelines } from '$groups/model/pipeline'
import { Status } from '$groups/model/status'
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
  projectPipelines: ProjectPipelines[]

  filters: {
    [groupId: GroupId]: {
      project: string
      branch: string
      topics: string[]
      statuses: Status[]
      pinnedPipelines: PipelineId[]
    }
  }
}

const { state, config } = createState(
  withProps<State>({
    projectPipelines: [],
    filters: Object()
  }),
  withRequestsStatus()
)

export const storeName = 'pipeline'
const store = new Store({ state, name: storeName, config })

persistState(store, {
  key: storeName,
  storage: localStorageStrategy,
  source: () => store.pipe(excludeKeys(['projectPipelines', 'requestsStatus']))
})

export const trackRequestsStatus = createRequestsStatusOperator(store)
export const { initialState } = store

@Injectable({ providedIn: 'root' })
export class PipelineStore {
  readonly projectsWithPipeline$ = store.pipe(
    map(({ projectPipelines }) => projectPipelines),
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
  readonly branchFilter = (groupId: GroupId) =>
    this.filters$.pipe(
      map((filters) => filters[groupId]?.branch || ''),
      distinctUntilChanged()
    )
  readonly statusesFilter = (groupId: GroupId) =>
    this.filters$.pipe(
      map((filters) => filters[groupId]?.statuses || []),
      distinctUntilChanged()
    )
  readonly pinnedPipelines = (groupId: GroupId) =>
    this.filters$.pipe(
      map((filters) => filters[groupId]?.pinnedPipelines || []),
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

  setBranchFilter(groupId: GroupId, branch: string): void {
    store.update((state) => {
      return {
        ...state,
        filters: {
          ...state.filters,
          [groupId]: {
            ...state.filters[groupId],
            branch
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

  setStatusesFilter(groupId: GroupId, statuses: Status[]): void {
    store.update((state) => {
      return {
        ...state,
        filters: {
          ...state.filters,
          [groupId]: {
            ...state.filters[groupId],
            statuses
          }
        }
      }
    })
  }

  setPinnedPipelines(groupId: GroupId, pinnedPipelines: PipelineId[]): void {
    store.update((state) => {
      return {
        ...state,
        filters: {
          ...state.filters,
          [groupId]: {
            ...state.filters[groupId],
            pinnedPipelines
          }
        }
      }
    })
  }

  setProjectsWithPipeline(projectPipelines: ProjectPipelines[]): void {
    store.update((state) => {
      return {
        ...state,
        projectPipelines
      }
    }, updateRequestStatus('getProjectsWithPipeline', 'success'))
  }
}
