import { createParams, retryConfig } from '$groups/http'
import { GroupId } from '$groups/model/group'
import { RunnerWithJobs } from '$groups/model/runner'
import { ErrorService } from '$service/error.service'
import { HttpClient, HttpErrorResponse } from '@angular/common/http'
import { Injectable, inject } from '@angular/core'
import { Observable, catchError, of, retry } from 'rxjs'

@Injectable({ providedIn: 'root' })
export class RunnerService {
  private http = inject(HttpClient)
  private errorService = inject(ErrorService)

  getRunners(groupId: GroupId, refresh = false, reportError = true): Observable<RunnerWithJobs[]> {
    const url = 'api/runners'
    const params = { ...createParams(groupId), refresh: String(refresh) }

    return this.http.get<RunnerWithJobs[]>(url, { params }).pipe(
      retry(retryConfig),
      catchError(({ status, error }: HttpErrorResponse) => {
        if (reportError) {
          this.errorService.setError({
            message: error?.message ?? 'Could not load GitLab runners',
            statusCode: status,
            groupId
          })
        }
        return of([])
      })
    )
  }
}
