import { HttpClient } from '@angular/common/http'
import { Injectable } from '@angular/core'
import { firstValueFrom, Observable } from 'rxjs'
import { DashboardStore, trackRequestsStatus } from '../dashboard.store'
import { Group } from '../models/group'

@Injectable()
export class GroupService {
  constructor(
    private readonly dashboardStore: DashboardStore,
    private readonly http: HttpClient
  ) {}

  getGroups(): Observable<Group[]> {
    return this.dashboardStore.groups$
  }

  isLoading(): Observable<boolean> {
    return this.dashboardStore.groupsLoading$
  }

  /**
   * Fetch Groups from API and save to store
   *
   * @see DashboardStore
   */
  async fetchGroups(): Promise<void> {
    const groups = await firstValueFrom(
      this.http
        .get<Group[]>(`${location.origin}/api/groups`)
        .pipe(trackRequestsStatus('groups'))
    )
    this.dashboardStore.updateGroups(groups)
  }
}
