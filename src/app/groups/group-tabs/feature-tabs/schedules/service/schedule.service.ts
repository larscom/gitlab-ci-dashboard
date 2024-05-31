import { retryConfig } from '$groups/http-retry-config'
import { GroupId } from '$groups/model/group'
import { ScheduleProjectLatestPipeline } from '$groups/model/schedule'
import { ErrorService } from '$service/error.service'
import { HttpClient } from '@angular/common/http'
import { Injectable, inject } from '@angular/core'
import { Observable, catchError, of, retry } from 'rxjs'

@Injectable({ providedIn: 'root' })
export class ScheduleService {
  private http = inject(HttpClient)
  private errorService = inject(ErrorService)

  getSchedules(groupId: GroupId): Observable<ScheduleProjectLatestPipeline[]> {
    const url = `${location.origin}/api/schedules`

    const params = { group_id: groupId }
    return this.http.get<ScheduleProjectLatestPipeline[]>(url, { params }).pipe(
      retry(retryConfig),
      catchError((err) => {
        this.errorService.setError(err.status)
        return of([])
      })
    )
  }
}
