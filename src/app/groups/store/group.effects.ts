import { Injectable, inject } from '@angular/core'
import { createEffect, ofType } from '@ngneat/effects'
import { switchMap, tap } from 'rxjs'
import { GroupService } from '../service/group.service'
import { fetchGroups } from './group.actions'
import { GroupStore } from './group.store'

@Injectable({ providedIn: 'root' })
export class GroupEffects {
  private store = inject(GroupStore)
  private service = inject(GroupService)

  fetchGroups = createEffect((actions) => {
    return actions.pipe(
      ofType(fetchGroups),
      switchMap(() => this.service.getGroups()),
      tap((groups) => this.store.setGroups(groups))
    )
  })
}
