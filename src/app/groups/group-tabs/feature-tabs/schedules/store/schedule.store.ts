import { GroupId } from '$groups/model/group'
import { ScheduleProjectLatestPipeline } from '$groups/model/schedule'
import { Status } from '$groups/model/status'
import { computed, inject } from '@angular/core'
import { patchState, signalStore, withMethods, withState } from '@ngrx/signals'
import { lastValueFrom } from 'rxjs'
import { ScheduleService } from '../service/schedule.service'
import { UIStore } from '$store/ui.store'

interface State {
  schedules: ScheduleProjectLatestPipeline[]
  loading: boolean
  filters: {
    [groupId: GroupId]: {
      project: string
      topics: string[]
      statuses: Status[]
    }
  }
}

export const ScheduleStore = signalStore(
  { providedIn: 'root' },
  withState<State>({
    schedules: [],
    filters: Object(),
    loading: false
  }),
  withMethods((store, service = inject(ScheduleService), uiStore = inject(UIStore)) => ({
    getProjectFilter(groupId: GroupId) {
      return computed(() => {
        const filters = store.filters()
        return filters[groupId]?.project || ''
      })
    },
    getTopicsFilter(groupId: GroupId) {
      return computed(() => {
        const filters = store.filters()
        return filters[groupId]?.topics || []
      })
    },
    getStatusesFilter(groupId: GroupId) {
      return computed(() => {
        const filters = store.filters()
        return filters[groupId]?.statuses || []
      })
    },
    async fetch(groupId: GroupId, withLoading: boolean = true) {
      uiStore.setAutoRefreshLoading(groupId, !withLoading)
      patchState(store, { loading: withLoading })

      const schedules = await lastValueFrom(service.getSchedules(groupId))

      patchState(store, { schedules, loading: false })
      uiStore.setAutoRefreshLoading(groupId, false)
    },
    setProjectFilter(groupId: GroupId, project: string) {
      patchState(store, (state) => {
        return {
          filters: {
            ...state.filters,
            [groupId]: {
              ...state.filters[groupId],
              project
            }
          }
        }
      })
    },
    setTopicsFilter(groupId: GroupId, topics: string[]) {
      patchState(store, (state) => {
        return {
          filters: {
            ...state.filters,
            [groupId]: {
              ...state.filters[groupId],
              topics
            }
          }
        }
      })
    },
    setStatusesFilter(groupId: GroupId, statuses: Status[]) {
      patchState(store, (state) => {
        return {
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
  }))
)
