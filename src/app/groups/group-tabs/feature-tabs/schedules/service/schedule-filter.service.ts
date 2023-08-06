import { ScheduleWithProjectAndPipeline } from '$model/schedule'
import { filterBy } from '$util/filter-by'
import { identity } from '$util/identity'
import { Injectable } from '@angular/core'
import { Observable, combineLatest, map } from 'rxjs'
import { ScheduleStore } from '../store/schedule.store'

@Injectable({ providedIn: 'root' })
export class ScheduleFilterService {
  constructor(private store: ScheduleStore) {}

  getSchedules(): Observable<ScheduleWithProjectAndPipeline[]> {
    return combineLatest([this.store.schedules$, this.store.projectFilterText$, this.store.projectFilterTopics$]).pipe(
      map(([data, filterText, filterTopics]) => {
        return data
          .filter(({ project: { name } }) => filterBy(name, filterText))
          .filter(({ project: { topics } }) => {
            return filterTopics.length ? filterTopics.map((filter) => topics.includes(filter)).every(identity) : true
          })
      })
    )
  }
}
