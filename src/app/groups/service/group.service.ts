import { retryConfig } from '$groups/http'
import { Group } from '$groups/model/group'
import { ErrorService } from '$service/error.service'
import { HttpClient, HttpErrorResponse } from '@angular/common/http'
import { Injectable, inject } from '@angular/core'
import { Observable, catchError, of, retry } from 'rxjs'

@Injectable({ providedIn: 'root' })
export class GroupService {
  private http = inject(HttpClient)
  private errorService = inject(ErrorService)

  getGroups(): Observable<Group[]> {
    return this.http.get<Group[]>('/api/groups').pipe(
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
