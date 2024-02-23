import { retryConfig } from '$groups/http-retry-config'
import { GroupId } from '$groups/model/group'
import { BranchLatestPipeline, ProjectLatestPipeline } from '$groups/model/pipeline'
import { ProjectId } from '$groups/model/project'
import { Status } from '$groups/model/status'
import { ErrorService } from '$service/error.service'
import { HttpClient } from '@angular/common/http'
import { Injectable, inject } from '@angular/core'
import { Observable, catchError, identity, map, retry, throwError } from 'rxjs'
import { trackRequestsStatus } from '../store/latest-pipeline.store'

@Injectable({ providedIn: 'root' })
export class LatestPipelineService {
  private http = inject(HttpClient)
  private errorService = inject(ErrorService)

  getProjectsWithLatestPipeline(
    groupId: GroupId,
    withLoader: boolean = true
  ): Observable<ProjectLatestPipeline[]> {
    const url = `${location.origin}/api/projects/latest-pipelines`

    const params = { groupId }
    return this.http.get<ProjectLatestPipeline[]>(url, { params }).pipe(
      withLoader ? trackRequestsStatus('getProjectsWithLatestPipeline') : identity,
      retry(retryConfig),
      catchError((err) => {
        this.errorService.setError(err.status)
        return throwError(() => err)
      })
    )
  }

  getBranchesWithLatestPipeline(projectId: ProjectId, withLoader: boolean = true): Observable<BranchLatestPipeline[]> {
    const url = `${location.origin}/api/branches/latest-pipelines`

    const params = { projectId }
    return this.http.get<BranchLatestPipeline[]>(url, { params }).pipe(
      map((branches) => branches.filter(({ branch }) => !branch.default)),
      withLoader ? trackRequestsStatus('getBranchesWithLatestPipeline') : identity,
      retry(retryConfig),
      catchError((err) => {
        this.errorService.setError(err.status)
        return throwError(() => err)
      })
    )
  }
}
