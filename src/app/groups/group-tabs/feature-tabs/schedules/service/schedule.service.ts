import { GroupId } from '$model/group'
import { ScheduleWithProjectAndPipeline } from '$model/schedule'
import { HttpClient } from '@angular/common/http'
import { Injectable } from '@angular/core'
import { Observable, identity } from 'rxjs'
import { trackRequestsStatus } from '../store/schedule.store'

@Injectable({ providedIn: 'root' })
export class ScheduleService {
  constructor(private http: HttpClient) {}

  getSchedules(groupId: GroupId, withLoader: boolean = true): Observable<ScheduleWithProjectAndPipeline[]> {
    const url = `${location.origin}/api/schedules`

    const params = { groupId }
    return this.http
      .get<ScheduleWithProjectAndPipeline[]>(url, { params })
      .pipe(withLoader ? trackRequestsStatus('getSchedules') : identity)
  }
}
