import { Injectable } from '@angular/core'
import { createState, select, Store, withProps } from '@ngneat/elf'
import {
  createRequestsStatusOperator,
  selectRequestStatus,
  updateRequestStatus,
  withRequestsStatus,
} from '@ngneat/elf-requests'
import { map } from 'rxjs'
import { Group } from '../models/group'

export interface GroupState {
  readonly groups: Group[]
  readonly filterText: string
}

const { state, config } = createState(
  withProps<GroupState>({ groups: [], filterText: '' }),
  withRequestsStatus()
)

const groupStore = new Store({ state, name: 'group', config })

export const trackRequestsStatus = createRequestsStatusOperator(groupStore)
export const initialState = groupStore.initialState

@Injectable()
export class GroupStore {
  readonly groups$ = groupStore.pipe(select(({ groups }) => groups))
  readonly groupsLoading$ = groupStore.pipe(
    selectRequestStatus('groups'),
    map(({ value }) => value === 'pending')
  )

  readonly filterText$ = groupStore.pipe(select(({ filterText }) => filterText))

  setGroups(groups: Group[]): void {
    groupStore.update(
      (state) => ({ ...state, groups }),
      updateRequestStatus('groups', 'success')
    )
  }

  setFilterText(filterText: string): void {
    groupStore.update((state) => ({ ...state, filterText }))
  }
}
