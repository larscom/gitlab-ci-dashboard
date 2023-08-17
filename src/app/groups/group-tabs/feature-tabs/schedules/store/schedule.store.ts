import { GroupId } from '$groups/model/group'
import { ScheduleWithProjectAndPipeline } from '$groups/model/schedule'
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
  schedules: ScheduleWithProjectAndPipeline[]

  filters: {
    [groupId: GroupId]: {
      project: string
      topics: string[]
    }
  }
}

const { state, config } = createState(withProps<State>({ schedules: [], filters: Object() }), withRequestsStatus())

export const storeName = 'schedule'
const store = new Store({ state, name: storeName, config })

persistState(store, {
  key: storeName,
  storage: localStorageStrategy,
  source: () => store.pipe(excludeKeys(['requestsStatus', 'schedules']))
})

export const trackRequestsStatus = createRequestsStatusOperator(store)
export const { initialState } = store

@Injectable({ providedIn: 'root' })
export class ScheduleStore {
  readonly schedules$ = store.pipe(
    map(({ schedules }) => schedules),
    distinctUntilChanged()
  )
  readonly loading$ = store.pipe(selectIsRequestPending('getSchedules'), distinctUntilChanged())

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

  setSchedules(schedules: ScheduleWithProjectAndPipeline[]): void {
    store.update((state) => {
      return {
        ...state,
        schedules
      }
    }, updateRequestStatus('getSchedules', 'success'))
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
}
