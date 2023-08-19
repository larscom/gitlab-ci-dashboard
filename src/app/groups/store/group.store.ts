import { Group, GroupId } from '$groups/model/group'
import { Injectable } from '@angular/core'
import { Store, createState, withProps } from '@ngneat/elf'
import {
  createRequestsStatusOperator,
  selectIsRequestPending,
  updateRequestStatus,
  withRequestsStatus
} from '@ngneat/elf-requests'
import { distinctUntilChanged, map } from 'rxjs'

interface State {
  groups: Group[]
  selectedGroupId?: GroupId
}

const { state, config } = createState(withProps<State>({ groups: [] }), withRequestsStatus())

export const storeName = 'group'
const store = new Store({ state, name: storeName, config })

export const trackRequestsStatus = createRequestsStatusOperator(store)

export const { initialState } = store

@Injectable({ providedIn: 'root' })
export class GroupStore {
  readonly groups$ = store.pipe(
    map(({ groups }) => groups),
    distinctUntilChanged()
  )
  readonly loading$ = store.pipe(selectIsRequestPending('getGroups'), distinctUntilChanged())

  readonly selectedGroupId$ = store.pipe(
    map(({ selectedGroupId }) => selectedGroupId),
    distinctUntilChanged()
  )

  setGroups(groups: Group[]): void {
    store.update((state) => ({ ...state, groups }), updateRequestStatus('getGroups', 'success'))
  }

  selectGroupId(groupId: GroupId): void {
    store.update((state) => {
      return {
        ...state,
        selectedGroupId: groupId
      }
    })
  }
}
