import { createParams, retryConfig } from '$groups/http'
import { GroupId } from '$groups/model/group'
import { ProjectId } from '$groups/model/project'
import { ScheduleProjectPipeline } from '$groups/model/schedule'
import { ErrorService } from '$service/error.service'
import { HttpClient } from '@angular/common/http'
import { Injectable, inject } from '@angular/core'
import { Observable, catchError, of, retry } from 'rxjs'

@Injectable({ providedIn: 'root' })
export class ScheduleService {
  private http = inject(HttpClient)
  private errorService = inject(ErrorService)

  getSchedules(groupId: GroupId, projectIds?: Set<ProjectId>): Observable<ScheduleProjectPipeline[]> {
    const url = `${location.origin}/api/schedules/latest-pipelines`

    const params = createParams(groupId, projectIds)

    return this.http.get<ScheduleProjectPipeline[]>(url, { params }).pipe(
      retry(retryConfig),
      catchError((err) => {
        this.errorService.setError(err.status)
        return of([])
      })
    )
  }
}
