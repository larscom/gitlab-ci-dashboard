import { ScheduleWithProjectAndPipeline } from '$groups/model/schedule'
import { filterProject } from '$groups/util/filter'
import { Injectable } from '@angular/core'
import { Observable, combineLatest, map } from 'rxjs'
import { ScheduleStore } from '../store/schedule.store'

@Injectable({ providedIn: 'root' })
export class ScheduleFilterService {
  constructor(private store: ScheduleStore) {}

  getSchedules(): Observable<ScheduleWithProjectAndPipeline[]> {
    return combineLatest([this.store.schedules$, this.store.projectFilterText$, this.store.projectFilterTopics$]).pipe(
      map(([data, filterText, filterTopics]) =>
        data.filter(({ project }) => filterProject(project, filterText, filterTopics))
      )
    )
  }
}
