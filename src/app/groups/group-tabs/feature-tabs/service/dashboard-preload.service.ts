import { createParams } from '$groups/http'
import { GroupId } from '$groups/model/group'
import { ProjectId } from '$groups/model/project'
import { HttpClient } from '@angular/common/http'
import { Injectable, inject } from '@angular/core'
import { EMPTY, Observable, catchError, concatMap, from, map, switchMap, timer } from 'rxjs'

export type DashboardFeature = 'latest-pipelines' | 'pipelines' | 'runners'

interface PreloadRequest {
  feature: DashboardFeature
  url: string
  params: Record<string, string>
}

const INITIAL_PRELOAD_DELAY = 750
const BETWEEN_PRELOAD_DELAY = 500

@Injectable({ providedIn: 'root' })
export class DashboardPreloadService {
  private http = inject(HttpClient)
  private scheduledGroups = new Set<GroupId>()

  preload(groupMap: Map<GroupId, Set<ProjectId>>, activeFeature: DashboardFeature): void {
    for (const [groupId, projectIds] of groupMap) {
      if (this.scheduledGroups.has(groupId)) continue
      this.scheduledGroups.add(groupId)

      const requests = this.requests(groupId, projectIds).filter(({ feature }) => feature !== activeFeature)
      from(requests)
        .pipe(
          concatMap((request, index) =>
            timer(index === 0 ? INITIAL_PRELOAD_DELAY : BETWEEN_PRELOAD_DELAY).pipe(
              switchMap(() => this.warm(request))
            )
          )
        )
        .subscribe()
    }
  }

  private requests(groupId: GroupId, projectIds: Set<ProjectId>): PreloadRequest[] {
    const params = createParams(groupId, projectIds)
    return [
      {
        feature: 'latest-pipelines',
        url: 'api/analytics/summary',
        params: { group_ids: String(groupId), hours: '24' }
      },
      {
        feature: 'pipelines',
        url: 'api/projects/pipelines',
        params: { ...params, refresh: 'true' }
      },
      {
        feature: 'runners',
        url: 'api/runners',
        params: { group_id: String(groupId), refresh: 'false' }
      }
    ]
  }

  private warm({ url, params }: PreloadRequest): Observable<void> {
    return this.http.get<unknown>(url, { params }).pipe(
      map(() => undefined),
      catchError(() => EMPTY)
    )
  }
}
