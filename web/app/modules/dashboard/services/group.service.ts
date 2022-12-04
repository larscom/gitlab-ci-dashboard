import { HttpClient } from '@angular/common/http'
import { Injectable } from '@angular/core'
import { Observable } from 'rxjs'
import { DashboardStore, trackRequestsStatus } from '../dashboard.store'
import { Group } from '../models/group'

@Injectable()
export class GroupService {
  constructor(
    private readonly dashboardStore: DashboardStore,
    private readonly http: HttpClient
  ) {}

  /**
   * Fetch Groups from API and save to store
   *
   * @see DashboardStore
   */
  getGroups(): Observable<Group[]> {
    this.http
      .get<Group[]>(`${location.origin}/api/groups`)
      .pipe(trackRequestsStatus('groups'))
      .subscribe((groups) => this.dashboardStore.updateGroups(groups))

    return this.dashboardStore.groups$
  }

  isLoading(): Observable<boolean> {
    return this.dashboardStore.groupsLoading$
  }
}
