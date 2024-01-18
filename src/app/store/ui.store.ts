import { GroupId } from '$groups/model/group'
import { ProjectId } from '$groups/model/project'
import { Injectable } from '@angular/core'
import { Store, createState, withProps } from '@ngneat/elf'
import { excludeKeys, localStorageStrategy, persistState } from '@ngneat/elf-persist-state'

import { distinctUntilChanged, map } from 'rxjs'

interface State {
  autoRefreshLoading: Record<GroupId | ProjectId, boolean>
  autoRefreshInterval: Record<GroupId | ProjectId, string>
}

const { state, config } = createState(withProps<State>({ autoRefreshLoading: Object(), autoRefreshInterval: Object() }))

export const storeName = 'ui'

const store = new Store({ state, name: storeName, config })
persistState(store, {
  key: storeName,
  storage: localStorageStrategy,
  source: () => store.pipe(excludeKeys(['autoRefreshLoading']))
})

export const { initialState } = store

@Injectable({ providedIn: 'root' })
export class UIStore {
  readonly autoRefreshLoading = (id: GroupId | ProjectId) =>
    store.pipe(
      map(({ autoRefreshLoading }) => autoRefreshLoading[id] ?? false),
      distinctUntilChanged()
    )
  readonly autoRefreshInterval = (id: GroupId | ProjectId) =>
    store.pipe(
      map(({ autoRefreshInterval }) => autoRefreshInterval[id] ?? '5'),
      distinctUntilChanged()
    )

  setAutoRefreshLoading(id: GroupId | ProjectId, loading: boolean): void {
    store.update((state) => {
      return {
        ...state,
        autoRefreshLoading: {
          ...state.autoRefreshLoading,
          [id]: loading
        }
      }
    })
  }

  setAutoRefreshInterval(id: GroupId | ProjectId, interval: string): void {
    store.update((state) => {
      return {
        ...state,
        autoRefreshInterval: {
          ...state.autoRefreshInterval,
          [id]: interval
        }
      }
    })
  }
}
