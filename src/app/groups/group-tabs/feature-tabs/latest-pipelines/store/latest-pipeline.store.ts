import { BranchWithLatestPipeline, ProjectWithLatestPipeline, Status } from '$groups/model/pipeline'
import { ProjectId } from '$groups/model/project'
import { recordToMap } from '$groups/util/map-record'
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
  projectsWithLatestPipeline: Record<Status, ProjectWithLatestPipeline[]>
  branchesWithLatestPipeline: BranchWithLatestPipeline[]
  projectFilterText: string
  projectFilterTopics: string[]
  branchFilterText: string
}

const { state, config } = createState(
  withProps<State>({
    projectsWithLatestPipeline: Object(),
    branchesWithLatestPipeline: [],
    projectFilterText: '',
    projectFilterTopics: [],
    branchFilterText: ''
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
      excludeKeys([
        'branchFilterText',
        'projectFilterText',
        'branchesWithLatestPipeline',
        'projectsWithLatestPipeline',
        'requestsStatus',
        'selectedProjectId'
      ])
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
    map(({ projectsWithLatestPipeline }) => recordToMap(projectsWithLatestPipeline)),
    distinctUntilChanged()
  )
  readonly projectsLoading$ = store.pipe(
    selectIsRequestPending('getProjectsWithLatestPipeline'),
    distinctUntilChanged()
  )

  readonly branchesWithLatestPipeline$ = store.pipe(
    map(({ branchesWithLatestPipeline }) => branchesWithLatestPipeline),
    distinctUntilChanged()
  )
  readonly branchesLoading$ = store.pipe(
    selectIsRequestPending('getBranchesWithLatestPipeline'),
    distinctUntilChanged()
  )

  readonly projectFilterTopics$ = store.pipe(
    map(({ projectFilterTopics }) => projectFilterTopics),
    distinctUntilChanged()
  )
  readonly projectFilterText$ = store.pipe(
    map(({ projectFilterText }) => projectFilterText),
    distinctUntilChanged()
  )

  readonly branchFilterText$ = store.pipe(
    map(({ branchFilterText }) => branchFilterText),
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

  setProjectFilterText(text: string): void {
    store.update((state) => {
      return {
        ...state,
        projectFilterText: text
      }
    })
  }

  setProjectFilterTopics(topics: string[]): void {
    store.update((state) => {
      return {
        ...state,
        projectFilterTopics: topics
      }
    })
  }

  setBranchFilterText(text: string): void {
    store.update((state) => {
      return {
        ...state,
        branchFilterText: text
      }
    })
  }

  setProjectsWithLatestPipeline(projectsWithLatestPipeline: Record<Status, ProjectWithLatestPipeline[]>): void {
    store.update((state) => {
      return {
        ...state,
        projectsWithLatestPipeline
      }
    }, updateRequestStatus('getProjectsWithLatestPipeline', 'success'))
  }

  setBranchesWithLatestPipeline(branchesWithLatestPipeline: BranchWithLatestPipeline[]): void {
    store.update((state) => {
      return {
        ...state,
        branchesWithLatestPipeline
      }
    }, updateRequestStatus('getBranchesWithLatestPipeline', 'success'))
  }
}
