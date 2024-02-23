import { GroupId } from '$groups/model/group'
import { BranchLatestPipeline, ProjectLatestPipeline } from '$groups/model/pipeline'
import { ProjectId } from '$groups/model/project'
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
  selectedProjectId?: ProjectId
  projectsLatestPipelines: ProjectLatestPipeline[]
  branchesLatestPipelines: BranchLatestPipeline[]

  filters: {
    [groupId: GroupId]: {
      project: string
      topics: string[]
      branch: string
    }
  }
}

const { state, config } = createState(
  withProps<State>({
    projectsLatestPipelines: [],
    branchesLatestPipelines: [],
    filters: Object()
  }),
  withRequestsStatus()
)

export const storeName = 'latest_pipeline'
const store = new Store({ state, name: storeName, config })

persistState(store, {
  key: storeName,
  storage: localStorageStrategy,
  source: () =>
    store.pipe(
      excludeKeys(['branchesLatestPipelines', 'projectsLatestPipelines', 'requestsStatus', 'selectedProjectId'])
    )
})

export const trackRequestsStatus = createRequestsStatusOperator(store)
export const { initialState } = store

@Injectable({ providedIn: 'root' })
export class LatestPipelineStore {
  readonly selectedProjectId$ = store.pipe(
    map(({ selectedProjectId }) => selectedProjectId),
    distinctUntilChanged()
  )

  readonly projectsWithLatestPipeline$ = store.pipe(
    map(({ projectsLatestPipelines }) => projectsLatestPipelines),
    distinctUntilChanged()
  )
  readonly projectsLoading$ = store.pipe(
    selectIsRequestPending('getProjectsWithLatestPipeline'),
    distinctUntilChanged()
  )

  readonly branchesWithLatestPipeline$ = store.pipe(
    map(({ branchesLatestPipelines }) => branchesLatestPipelines),
    distinctUntilChanged()
  )
  readonly branchesLoading$ = store.pipe(
    selectIsRequestPending('getBranchesWithLatestPipeline'),
    distinctUntilChanged()
  )

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

  selectProjectId(projectId?: ProjectId): void {
    store.update((state) => {
      return {
        ...state,
        selectedProjectId: projectId
      }
    })
  }

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

  setProjectsWithLatestPipeline(projectsLatestPipelines: ProjectLatestPipeline[]): void {
    store.update((state) => {
      return {
        ...state,
        projectsLatestPipelines
      }
    }, updateRequestStatus('getProjectsWithLatestPipeline', 'success'))
  }

  setBranchesWithLatestPipeline(branchesLatestPipelines: BranchLatestPipeline[]): void {
    store.update((state) => {
      return {
        ...state,
        branchesLatestPipelines
      }
    }, updateRequestStatus('getBranchesWithLatestPipeline', 'success'))
  }
}
