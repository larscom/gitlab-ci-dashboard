import { trackRequestsStatus } from '$groups/store/group.store'
import { Group } from '$groups/model/group'
import { HttpClient } from '@angular/common/http'
import { Injectable } from '@angular/core'
import { Observable, catchError, throwError } from 'rxjs'
import { ErrorService } from '../../service/alert.service'

@Injectable({ providedIn: 'root' })
export class GroupService {
  constructor(private http: HttpClient, private errorService: ErrorService) {}

  getGroups(): Observable<Group[]> {
    return this.http.get<Group[]>(`${location.origin}/api/groups`).pipe(
      trackRequestsStatus('getGroups'),
      catchError((err) => {
        this.errorService.setError(err.status)
        return throwError(() => err)
      })
    )
  }
}
