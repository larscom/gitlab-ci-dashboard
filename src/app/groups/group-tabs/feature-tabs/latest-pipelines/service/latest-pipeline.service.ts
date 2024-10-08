import { createParams, retryConfig } from '$groups/http'
import { BranchPipeline } from '$groups/model/branch'
import { GroupId } from '$groups/model/group'
import { ProjectId, ProjectPipeline } from '$groups/model/project'
import { ErrorService } from '$service/error.service'
import { HttpClient, HttpErrorResponse } from '@angular/common/http'
import { Injectable, inject } from '@angular/core'
import { Observable, catchError, map, of, retry } from 'rxjs'

@Injectable({ providedIn: 'root' })
export class LatestPipelineService {
  private http = inject(HttpClient)
  private errorService = inject(ErrorService)

  getProjectsWithLatestPipeline(groupId: GroupId, projectIds?: Set<ProjectId>): Observable<ProjectPipeline[]> {
    const url = '/api/projects/latest-pipelines'
    const params = createParams(groupId, projectIds)

    return this.http.get<ProjectPipeline[]>(url, { params }).pipe(
      retry(retryConfig),
      catchError(({ status, error }: HttpErrorResponse) => {
        this.errorService.setError({
          message: error.message,
          statusCode: status,
          groupId
        })
        return of([])
      })
    )
  }

  getBranchesWithLatestPipeline(projectId: ProjectId): Observable<BranchPipeline[]> {
    const url = '/api/branches/latest-pipelines'
    const params = { project_id: projectId }

    return this.http.get<BranchPipeline[]>(url, { params }).pipe(
      map((branches) => branches.filter(({ branch }) => !branch.default)),
      retry(retryConfig),
      catchError(({ status, error }: HttpErrorResponse) => {
        this.errorService.setError({
          statusCode: status,
          message: error.message
        })
        return of([])
      })
    )
  }
}
