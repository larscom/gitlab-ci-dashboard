import { retryConfig } from '$groups/http-retry-config'
import { GroupId } from '$groups/model/group'
import { ScheduleProjectLatestPipeline } from '$groups/model/schedule'
import { ErrorService } from '$service/error.service'
import { HttpClient } from '@angular/common/http'
import { Injectable, inject } from '@angular/core'
import { Observable, catchError, identity, retry, throwError } from 'rxjs'
import { trackRequestsStatus } from '../store/schedule.store'

@Injectable({ providedIn: 'root' })
export class ScheduleService {
  private http = inject(HttpClient)
  private errorService = inject(ErrorService)

  getSchedules(groupId: GroupId, withLoader: boolean = true): Observable<ScheduleProjectLatestPipeline[]> {
    const url = `${location.origin}/api/schedules`

    const params = { groupId }
    return this.http.get<ScheduleProjectLatestPipeline[]>(url, { params }).pipe(
      withLoader ? trackRequestsStatus('getSchedules') : identity,
      retry(retryConfig),
      catchError((err) => {
        this.errorService.setError(err.status)
        return throwError(() => err)
      })
    )
  }
}
