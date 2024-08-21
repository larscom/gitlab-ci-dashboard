import { retryConfig } from '$groups/http'
import { Branch } from '$groups/model/branch'
import { ProjectId } from '$groups/model/project'
import { ErrorService } from '$service/error.service'
import { HttpClient, HttpErrorResponse } from '@angular/common/http'
import { Injectable, inject } from '@angular/core'
import { Observable, catchError, of, retry } from 'rxjs'

@Injectable({ providedIn: 'root' })
export class BranchService {
  private http = inject(HttpClient)
  private errorService = inject(ErrorService)

  getBranches(projectId: ProjectId): Observable<Branch[]> {
    const params = { project_id: projectId }
    return this.http.get<Branch[]>('/api/branches', { params }).pipe(
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
