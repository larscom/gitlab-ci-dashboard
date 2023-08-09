import { GroupId } from '$groups/model/group'
import { BranchWithLatestPipeline, ProjectWithLatestPipeline, Status } from '$groups/model/pipeline'
import { ProjectId } from '$groups/model/project'
import { ErrorService } from '$service/alert.service'
import { HttpClient } from '@angular/common/http'
import { Injectable } from '@angular/core'
import { Observable, catchError, identity, map, throwError } from 'rxjs'
import { trackRequestsStatus } from '../store/latest-pipeline.store'

@Injectable({ providedIn: 'root' })
export class LatestPipelineService {
  constructor(private http: HttpClient, private errorService: ErrorService) {}

  getProjectsWithLatestPipeline(
    groupId: GroupId,
    withLoader: boolean = true
  ): Observable<Record<Status, ProjectWithLatestPipeline[]>> {
    const url = `${location.origin}/api/projects/latest-pipelines`

    const params = { groupId }
    return this.http.get<Record<Status, ProjectWithLatestPipeline[]>>(url, { params }).pipe(
      withLoader ? trackRequestsStatus('getProjectsWithLatestPipeline') : identity,
      catchError((err) => {
        this.errorService.setError(err.status)
        return throwError(() => err)
      })
    )
  }

  getBranchesWithLatestPipeline(
    projectId: ProjectId,
    withLoader: boolean = true
  ): Observable<BranchWithLatestPipeline[]> {
    const url = `${location.origin}/api/branches/latest-pipelines`

    const params = { projectId }
    return this.http.get<BranchWithLatestPipeline[]>(url, { params }).pipe(
      map((branches) => branches.filter(({ branch }) => !branch.default)),
      withLoader ? trackRequestsStatus('getBranchesWithLatestPipeline') : identity,
      catchError((err) => {
        this.errorService.setError(err.status)
        return throwError(() => err)
      })
    )
  }
}
