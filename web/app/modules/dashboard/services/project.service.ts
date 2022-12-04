import { HttpClient } from '@angular/common/http'
import { Injectable } from '@angular/core'
import { map, Observable } from 'rxjs'
import { DashboardStore, trackRequestsStatus } from '../dashboard.store'
import { GroupId } from '../models/group'
import { Status } from '../models/pipeline'
import { ProjectWithLatestPipeline } from '../models/project-with-pipeline'

@Injectable()
export class ProjectService {
  constructor(
    private readonly dashboardStore: DashboardStore,
    private readonly http: HttpClient
  ) {}

  /**
   * Fetch Projects with Pipelines from API and save to store
   *
   * @see DashboardStore
   */
  fetchProjects(
    groupId: GroupId
  ): Observable<Record<Status, ProjectWithLatestPipeline[]>> {
    this.http
      .get<Record<Status, ProjectWithLatestPipeline[]>>(
        `${location.origin}/api/groups/${groupId}/projects`
      )
      .pipe(trackRequestsStatus('projects'))
      .subscribe((projects) =>
        this.dashboardStore.updateProjects(groupId, projects)
      )

    return this.dashboardStore.projects$.pipe(
      map((projects) => projects[groupId] || {})
    )
  }

  isLoading(): Observable<boolean> {
    return this.dashboardStore.projectsLoading$
  }
}
