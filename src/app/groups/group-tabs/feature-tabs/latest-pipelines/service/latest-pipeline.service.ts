import { retryConfig } from '$groups/http-retry-config'
import { GroupId } from '$groups/model/group'
import { BranchLatestPipeline, ProjectLatestPipeline } from '$groups/model/pipeline'
import { ProjectId } from '$groups/model/project'
import { ErrorService } from '$service/error.service'
import { HttpClient } from '@angular/common/http'
import { Injectable, inject } from '@angular/core'
import { Observable, catchError, map, of, retry } from 'rxjs'

@Injectable({ providedIn: 'root' })
export class LatestPipelineService {
  private http = inject(HttpClient)
  private errorService = inject(ErrorService)

  getProjectsWithLatestPipeline(groupId: GroupId): Observable<ProjectLatestPipeline[]> {
    const url = `${location.origin}/api/projects/latest-pipelines`

    const params = { group_id: groupId }
    return this.http.get<ProjectLatestPipeline[]>(url, { params }).pipe(
      retry(retryConfig),
      catchError((err) => {
        this.errorService.setError(err.status)
        return of([])
      })
    )
  }

  getBranchesWithLatestPipeline(projectId: ProjectId): Observable<BranchLatestPipeline[]> {
    const url = `${location.origin}/api/branches/latest-pipelines`

    const params = { project_id: projectId }
    return this.http.get<BranchLatestPipeline[]>(url, { params }).pipe(
      map((branches) => branches.filter(({ branch }) => !branch.default)),
      retry(retryConfig),
      catchError((err) => {
        this.errorService.setError(err.status)
        return of([])
      })
    )
  }
}
