import { UIStore } from '$store/ui.store'
import { Injectable } from '@angular/core'
import { createEffect, ofType } from '@ngneat/effects'
import { of, switchMap, tap, zip } from 'rxjs'
import { ScheduleService } from '../service/schedule.service'
import { fetchSchedules } from './schedule.actions'
import { ScheduleStore } from './schedule.store'

@Injectable({ providedIn: 'root' })
export class ScheduleEffects {
  fetchSchedules = createEffect((actions) => {
    return actions.pipe(
      ofType(fetchSchedules),
      tap(({ groupId, withLoader }) => this.uiStore.setAutoRefreshLoading(groupId, !withLoader)),
      switchMap(({ groupId, withLoader }) => zip(of(groupId), this.scheduleService.getSchedules(groupId, withLoader))),
      tap(([_, schedules]) => this.scheduleStore.setSchedules(schedules)),
      tap(([groupId]) => this.uiStore.setAutoRefreshLoading(groupId, false))
    )
  })

  constructor(
    private scheduleService: ScheduleService,
    private scheduleStore: ScheduleStore,
    private uiStore: UIStore
  ) {}
}
