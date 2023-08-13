import { GroupId } from '$groups/model/group'
import { ProjectWithPipeline } from '$groups/model/pipeline'
import { ErrorService } from '$service/alert.service'
import { HttpClient } from '@angular/common/http'
import { Injectable } from '@angular/core'
import { Observable, catchError, identity, throwError } from 'rxjs'
import { trackRequestsStatus } from '../store/pipeline.store'

@Injectable({ providedIn: 'root' })
export class PipelineService {
  constructor(private http: HttpClient, private errorService: ErrorService) {}

  getProjectsWithPipeline(groupId: GroupId, withLoader: boolean = true): Observable<ProjectWithPipeline[]> {
    const url = `${location.origin}/api/projects/pipelines`

    const params = { groupId }
    return this.http.get<ProjectWithPipeline[]>(url, { params }).pipe(
      withLoader ? trackRequestsStatus('getProjectsWithPipeline') : identity,
      catchError((err) => {
        this.errorService.setError(err.status)
        return throwError(() => err)
      })
    )
  }
}
