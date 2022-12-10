import { filterBy } from '@/app/shared/util/filters'
import { HttpClient } from '@angular/common/http'
import { Injectable } from '@angular/core'
import { combineLatest, firstValueFrom, map, Observable } from 'rxjs'
import { Group } from '../models/group'
import { GroupStore, trackRequestsStatus } from '../store/group-store'

@Injectable()
export class GroupService {
  constructor(
    private readonly groupStore: GroupStore,
    private readonly http: HttpClient
  ) {}

  isLoading(): Observable<boolean> {
    return this.groupStore.groupsLoading$
  }

  /**
   * Fetch Groups from API and save to store
   *
   * @see GroupStore
   */
  async fetchGroups(): Promise<void> {
    const groups = await firstValueFrom(
      this.http
        .get<Group[]>(`${location.origin}/api/groups`)
        .pipe(trackRequestsStatus('groups'))
    )

    this.groupStore.setGroups(groups)
  }

  /**
   * Get all groups filtered by name
   *
   * @see GroupStore
   */
  getFilteredGroups(): Observable<Group[]> {
    return combineLatest([
      this.groupStore.filterText$,
      this.groupStore.groups$,
    ]).pipe(
      map(([filter, groups]) =>
        groups.filter(({ name }) => filterBy(name, filter))
      )
    )
  }

  /**
   * Set filter to filter groups inside store
   *
   * @see GroupStore
   */
  setFilterText(filterText: string): void {
    this.groupStore.setFilterText(filterText)
  }
}
