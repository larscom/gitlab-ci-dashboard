import { createParams, retryConfig } from '$groups/http'
import { GroupId } from '$groups/model/group'
import { ProjectId, ProjectPipelines } from '$groups/model/project'
import { ErrorService } from '$service/error.service'
import { HttpClient, HttpErrorResponse } from '@angular/common/http'
import { Injectable, inject } from '@angular/core'
import { Observable, catchError, of, retry } from 'rxjs'

@Injectable({ providedIn: 'root' })
export class PipelinesService {
  private http = inject(HttpClient)
  private errorService = inject(ErrorService)

  getProjectsWithPipelines(groupId: GroupId, projectIds?: Set<ProjectId>): Observable<ProjectPipelines[]> {
    const url = `${location.origin}/api/projects/pipelines`
    const params = createParams(groupId, projectIds)

    return this.http.get<ProjectPipelines[]>(url, { params }).pipe(
      retry(retryConfig),
      catchError(({ status, statusText, error }: HttpErrorResponse) => {
        this.errorService.setError({
          message: error.message,
          statusCode: status,
          statusText,
          groupId
        })
        return of([])
      })
    )
  }
}
