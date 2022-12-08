import { filterBy } from '@/app/shared/util/filters'
import { Injectable } from '@angular/core'
import { createState, select, Store, withProps } from '@ngneat/elf'
import {
  createRequestsStatusOperator,
  selectRequestStatus,
  updateRequestStatus,
  withRequestsStatus,
} from '@ngneat/elf-requests'
import { map, withLatestFrom } from 'rxjs'
import { Group } from '../models/group'

export interface GroupState {
  readonly groups: Group[]
  readonly query: string
}

const { state, config } = createState(
  withProps<GroupState>({ groups: [], query: '' }),
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

  readonly foundGroups$ = groupStore
    .pipe(
      select(({ query }) => query),
      withLatestFrom(this.groups$)
    )
    .pipe(
      map(([query, groups]) =>
        groups.filter(({ name }) => filterBy(name, query))
      )
    )

  update(groups: Group[]): void {
    groupStore.update(
      (state) => ({ ...state, groups }),
      updateRequestStatus('groups', 'success')
    )
  }

  search(query: string): void {
    groupStore.update((state) => ({ ...state, query }))
  }
}
