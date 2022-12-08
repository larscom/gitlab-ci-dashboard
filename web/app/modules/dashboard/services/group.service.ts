import { HttpClient } from '@angular/common/http'
import { Injectable } from '@angular/core'
import { Observable } from 'rxjs'
import { Group } from '../models/group'
import { GroupStore, trackRequestsStatus } from '../store/group-store'

@Injectable()
export class GroupService {
  constructor(
    private readonly groupStore: GroupStore,
    private readonly http: HttpClient
  ) {}

  /**
   * Fetch Groups from API and save to store
   *
   * @see DashboardStore
   */
  fetchGroups(): Observable<Group[]> {
    this.http
      .get<Group[]>(`${location.origin}/api/groups`)
      .pipe(trackRequestsStatus('groups'))
      .subscribe((groups) => this.groupStore.update(groups))

    return this.groupStore.groups$
  }

  filteredGroups(): Observable<Group[]> {
    return this.groupStore.foundGroups$
  }

  isLoading(): Observable<boolean> {
    return this.groupStore.groupsLoading$
  }

  /**
   * Search for groups inside store
   *
   * @see DashboardStore
   */
  search(query: string): void {
    this.groupStore.search(query)
  }
}
