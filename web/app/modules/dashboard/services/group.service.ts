import { HttpClient } from '@angular/common/http'
import { Injectable } from '@angular/core'
import { map, Observable, share, shareReplay } from 'rxjs'
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
  fetchGroups(): Observable<Group[]> {
    this.http
      .get<Group[]>(`${location.origin}/api/groups`)
      .pipe(trackRequestsStatus('groups'))
      .subscribe((groups) => this.dashboardStore.updateGroups(groups))

    return this.dashboardStore.groups$
  }

  /**
   * Search for groups inside store
   *
   * @see DashboardStore
   */
  search(query: string): Observable<Group[]> {
    const filterBy = (value: string) =>
      value.toLocaleLowerCase().includes(query.toLocaleLowerCase())

    return this.dashboardStore.groups$.pipe(
      map((groups) => groups.filter(({ name }) => filterBy(name)))
    )
  }

  isLoading(): Observable<boolean> {
    return this.dashboardStore.groupsLoading$
  }
}
