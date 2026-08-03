import { createParams, retryConfig } from '$groups/http'
import { GroupId } from '$groups/model/group'
import { Pipeline, Source } from '$groups/model/pipeline'
import { ProjectId, ProjectPipelines } from '$groups/model/project'
import { ErrorService } from '$service/error.service'
import { HttpClient, HttpErrorResponse } from '@angular/common/http'
import { Injectable, inject } from '@angular/core'
import { Observable, catchError, of, retry, switchMap } from 'rxjs'

@Injectable({ providedIn: 'root' })
export class PipelinesService {
  private http = inject(HttpClient)
  private errorService = inject(ErrorService)

  getProjectsWithPipelines(
    groupId: GroupId,
    projectIds?: Set<ProjectId>,
    refresh = false,
    hours = 24
  ): Observable<ProjectPipelines[]> {
    const params = { ...createParams(groupId, projectIds), hours: String(hours) }
    const persisted = () => this.http.get<ProjectPipelines[]>('api/analytics/pipelines', { params })
    const request = refresh
      ? this.http
          .get<ProjectPipelines[]>('api/projects/pipelines', {
            params: { ...createParams(groupId, projectIds), refresh: 'true' }
          })
          .pipe(switchMap(persisted))
      : persisted()

    return request.pipe(
      retry(retryConfig),
      catchError(({ status, error }: HttpErrorResponse) => {
        this.errorService.setError({
          message: error?.message ?? 'Could not load persisted pipelines',
          statusCode: status,
          groupId
        })
        return of([])
      })
    )
  }

  getPipelines(projectId: ProjectId, source?: Source): Observable<Pipeline[]> {
    const url = 'api/pipelines'
    const params = { project_id: projectId }

    return this.http.get<Pipeline[]>(url, { params: source ? { ...params, source } : params }).pipe(
      retry(retryConfig),
      catchError(({ status, error }: HttpErrorResponse) => {
        this.errorService.setError({
          message: error.message,
          statusCode: status
        })
        return of([])
      })
    )
  }
}
