import { ScheduleWithProjectAndPipeline } from '$groups/model/schedule'
import { GroupStore } from '$groups/store/group.store'
import { filterNotNull, filterPipeline, filterProject } from '$groups/util/filter'
import { Injectable, inject } from '@angular/core'
import { Observable, combineLatest, map, switchMap } from 'rxjs'
import { ScheduleStore } from '../store/schedule.store'

@Injectable({ providedIn: 'root' })
export class ScheduleFilterService {
  private scheduleStore = inject(ScheduleStore)
  private groupStore = inject(GroupStore)
  private selectedGroupId$ = this.groupStore.selectedGroupId$.pipe(filterNotNull)

  getSchedules(): Observable<ScheduleWithProjectAndPipeline[]> {
    return combineLatest([
      this.scheduleStore.schedules$,
      this.selectedGroupId$.pipe(switchMap((groupId) => this.scheduleStore.projectFilter(groupId))),
      this.selectedGroupId$.pipe(switchMap((groupId) => this.scheduleStore.topicsFilter(groupId))),
      this.selectedGroupId$.pipe(switchMap((groupId) => this.scheduleStore.statusesFilter(groupId)))
    ]).pipe(
      map(([data, filterText, filterTopics, filterStatuses]) =>
        data.filter(({ pipeline, project }) => {
          const filter = filterProject(project, filterText, filterTopics)
          if (pipeline) {
            return filter && filterPipeline(pipeline, '', filterStatuses)
          }
          return filter
        })
      )
    )
  }
}
