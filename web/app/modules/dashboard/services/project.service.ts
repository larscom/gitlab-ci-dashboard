import { HttpClient } from '@angular/common/http'
import { Injectable } from '@angular/core'
import { firstValueFrom, map, Observable } from 'rxjs'
import { DashboardStore, trackRequestsStatus } from '../dashboard.store'
import { GroupId } from '../models/group'
import { Status } from '../models/pipeline'
import { ProjectWithPipelines } from '../models/project-with-pipelines'

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
  getProjectsGroupedByStatus(
    groupId: GroupId
  ): Observable<Record<Status, ProjectWithPipelines[]>> {
    return this.getProjects(groupId).pipe(
      map((projects) =>
        projects.reduce((result, current) => {
          const latest = current.pipelines[0]
          if (!latest) {
            result['unknown'] = result['unknown']
              ? [...result['unknown'], current]
              : [current]
          } else if (result[latest.status]) {
            result[latest.status] = [...result[latest.status], current]
          } else {
            result[latest.status] = [current]
          }
          return result
        }, {} as Record<Status, ProjectWithPipelines[]>)
      )
    )
  }

  isLoading(): Observable<boolean> {
    return this.dashboardStore.projectsLoading$
  }

  private getProjects(groupId: GroupId): Observable<ProjectWithPipelines[]> {
    this.http
      .get<ProjectWithPipelines[]>(
        `${location.origin}/api/groups/${groupId}/projects`
      )
      .pipe(trackRequestsStatus('projects'))
      .subscribe((projects) =>
        this.dashboardStore.updateProjects(groupId, projects)
      )

    return this.dashboardStore.projects$.pipe(
      map((projects) => projects[groupId] || [])
    )
  }
}
