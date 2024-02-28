import { Group, GroupId } from '$groups/model/group'
import { GroupService } from '$groups/service/group.service'
import { inject } from '@angular/core'
import { patchState, signalStore, withMethods, withState } from '@ngrx/signals'
import { lastValueFrom } from 'rxjs'

interface State {
  groups: Group[]
  loading: boolean
  selectedGroupId: GroupId | undefined
}

export const GroupStore = signalStore(
  { providedIn: 'root' },
  withState<State>({
    groups: [],
    selectedGroupId: undefined,
    loading: false
  }),
  withMethods((store, service = inject(GroupService)) => ({
    async fetch() {
      patchState(store, { loading: true })
      const groups = await lastValueFrom(service.getGroups())
      patchState(store, { groups, loading: false })
    },
    selectGroupId(groupId: GroupId) {
      patchState(store, { selectedGroupId: groupId })
    }
  }))
)
