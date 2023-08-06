import { ScheduleWithProjectAndPipeline } from '$model/schedule'
import { Injectable } from '@angular/core'
import { Store, createState, withProps } from '@ngneat/elf'
import { excludeKeys, localStorageStrategy, persistState } from '@ngneat/elf-persist-state'
import {
  createRequestsStatusOperator,
  selectRequestStatus,
  updateRequestStatus,
  withRequestsStatus
} from '@ngneat/elf-requests'
import { distinctUntilChanged, map } from 'rxjs'

interface State {
  schedules: ScheduleWithProjectAndPipeline[]
  projectFilterText: string
  projectFilterTopics: string[]
}

const { state, config } = createState(
  withProps<State>({ schedules: [], projectFilterText: '', projectFilterTopics: [] }),
  withRequestsStatus()
)

export const storeName = 'schedules'
const store = new Store({ state, name: storeName, config })

persistState(store, {
  key: storeName,
  storage: localStorageStrategy,
  source: () => store.pipe(excludeKeys(['projectFilterText', 'requestsStatus', 'schedules']))
})

export const trackRequestsStatus = createRequestsStatusOperator(store)
export const { initialState } = store

@Injectable({ providedIn: 'root' })
export class ScheduleStore {
  readonly schedules$ = store.pipe(
    map(({ schedules }) => schedules),
    distinctUntilChanged()
  )
  readonly loading$ = store.pipe(
    selectRequestStatus('getSchedules'),
    map(({ value }) => value === 'pending'),
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

  setSchedules(schedules: ScheduleWithProjectAndPipeline[]): void {
    store.update((state) => {
      return {
        ...state,
        schedules
      }
    }, updateRequestStatus('getSchedules', 'success'))
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
}
