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
  projectFilterText: string
  projectFilterTopics: string[]
}

const { state, config } = createState(
  withProps<State>({
    projectsWithPipeline: [],
    projectFilterText: '',
    projectFilterTopics: []
  }),
  withRequestsStatus()
)

export const storeName = 'pipeline'
const store = new Store({ state, name: storeName, config })

persistState(store, {
  key: storeName,
  storage: localStorageStrategy,
  source: () => store.pipe(excludeKeys(['projectsWithPipeline', 'projectFilterText', 'requestsStatus']))
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

  readonly projectFilterTopics$ = store.pipe(
    map(({ projectFilterTopics }) => projectFilterTopics),
    distinctUntilChanged()
  )
  readonly projectFilterText$ = store.pipe(
    map(({ projectFilterText }) => projectFilterText),
    distinctUntilChanged()
  )

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

  setProjectsWithPipeline(projectsWithPipeline: ProjectWithPipeline[]): void {
    store.update((state) => {
      return {
        ...state,
        projectsWithPipeline
      }
    }, updateRequestStatus('getProjectsWithPipeline', 'success'))
  }
}
