import { Injectable } from '@angular/core'
import { createEffect, ofType } from '@ngneat/effects'
import { switchMap, tap } from 'rxjs'
import { GroupService } from '../service/group.service'
import { fetchGroups } from './group.actions'
import { GroupStore } from './group.store'

@Injectable({ providedIn: 'root' })
export class GroupEffects {
  fetchGroups = createEffect((actions) => {
    return actions.pipe(
      ofType(fetchGroups),
      switchMap(() => this.service.getGroups()),
      tap((groups) => this.store.setGroups(groups))
    )
  })

  constructor(private store: GroupStore, private service: GroupService) {}
}
