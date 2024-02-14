import { retryConfig } from '$groups/http-retry-config'
import { Group } from '$groups/model/group'
import { trackRequestsStatus } from '$groups/store/group.store'
import { ErrorService } from '$service/error.service'
import { HttpClient } from '@angular/common/http'
import { Injectable } from '@angular/core'
import { Observable, catchError, retry, throwError } from 'rxjs'

@Injectable({ providedIn: 'root' })
export class GroupService {
  constructor(private http: HttpClient, private errorService: ErrorService) {}

  getGroups(): Observable<Group[]> {
    return this.http.get<Group[]>(`${location.origin}/api/groups`).pipe(
      trackRequestsStatus('getGroups'),
      retry(retryConfig),
      catchError((err) => {
        this.errorService.setError(err.status)
        return throwError(() => err)
      })
    )
  }
}
