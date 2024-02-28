import { GroupId } from '$groups/model/group'
import { ProjectId } from '$groups/model/project'
import { computed } from '@angular/core'
import { withStorage } from '@larscom/ngrx-signals-storage'
import { patchState, signalStore, withMethods, withState } from '@ngrx/signals'

interface State {
  autoRefreshLoading: Record<GroupId | ProjectId, boolean>
  autoRefreshInterval: Record<GroupId | ProjectId, string>
}

export const UIStore = signalStore(
  { providedIn: 'root' },
  withState<State>({
    autoRefreshLoading: Object(),
    autoRefreshInterval: Object()
  }),
  withStorage('UIStore', localStorage),
  withMethods((store) => ({
    getAutoRefreshLoading(id: GroupId | ProjectId) {
      return computed(() => {
        const autoRefreshLoading = store.autoRefreshLoading()
        return autoRefreshLoading[id] ?? false
      })
    },
    getAutoRefreshInterval(id: GroupId | ProjectId) {
      return computed(() => {
        const autoRefreshInterval = store.autoRefreshInterval()
        return autoRefreshInterval[id] ?? '3'
      })
    },
    setAutoRefreshLoading(id: GroupId | ProjectId, loading: boolean) {
      patchState(store, (state) => {
        return {
          autoRefreshLoading: {
            ...state.autoRefreshLoading,
            [id]: loading
          }
        }
      })
    },
    setAutoRefreshInterval(id: GroupId | ProjectId, interval: string) {
      patchState(store, (state) => {
        return {
          autoRefreshInterval: {
            ...state.autoRefreshInterval,
            [id]: interval
          }
        }
      })
    }
  }))
)
