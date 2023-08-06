import { trackRequestsStatus } from '$groups/store/group.store'
import { Group } from '$model/group'
import { HttpClient } from '@angular/common/http'
import { Injectable } from '@angular/core'
import { Observable } from 'rxjs'

@Injectable({ providedIn: 'root' })
export class GroupService {
  constructor(private http: HttpClient) {}

  getGroups(): Observable<Group[]> {
    return this.http.get<Group[]>(`${location.origin}/api/groups`).pipe(trackRequestsStatus('getGroups'))
  }
}
