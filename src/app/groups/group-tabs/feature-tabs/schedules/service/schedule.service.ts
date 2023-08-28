import { GroupId } from '$groups/model/group'
import { ScheduleWithProjectAndPipeline } from '$groups/model/schedule'
import { ErrorService } from '$service/error.service'
import { HttpClient } from '@angular/common/http'
import { Injectable } from '@angular/core'
import { Observable, catchError, identity, throwError } from 'rxjs'
import { trackRequestsStatus } from '../store/schedule.store'

@Injectable({ providedIn: 'root' })
export class ScheduleService {
  constructor(private http: HttpClient, private errorService: ErrorService) {}

  getSchedules(groupId: GroupId, withLoader: boolean = true): Observable<ScheduleWithProjectAndPipeline[]> {
    const url = `${location.origin}/api/schedules`

    const params = { groupId }
    return this.http.get<ScheduleWithProjectAndPipeline[]>(url, { params }).pipe(
      withLoader ? trackRequestsStatus('getSchedules') : identity,
      catchError((err) => {
        this.errorService.setError(err.status)
        return throwError(() => err)
      })
    )
  }
}
