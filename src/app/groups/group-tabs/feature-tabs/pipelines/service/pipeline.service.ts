import { retryConfig } from '$groups/http-retry-config'
import { GroupId } from '$groups/model/group'
import { ProjectPipelines } from '$groups/model/pipeline'
import { ErrorService } from '$service/error.service'
import { HttpClient } from '@angular/common/http'
import { Injectable, inject } from '@angular/core'
import { Observable, catchError, of, retry } from 'rxjs'

@Injectable({ providedIn: 'root' })
export class PipelineService {
  private http = inject(HttpClient)
  private errorService = inject(ErrorService)

  getProjectsWithPipeline(groupId: GroupId): Observable<ProjectPipelines[]> {
    const url = `${location.origin}/api/projects/pipelines`

    const params = { groupId }
    return this.http.get<ProjectPipelines[]>(url, { params }).pipe(
      retry(retryConfig),
      catchError((err) => {
        this.errorService.setError(err.status)
        return of([])
      })
    )
  }
}
