import { HttpClient } from '@angular/common/http'
import { Injectable } from '@angular/core'
import { Observable } from 'rxjs'
import { GroupId } from '../models/group'
import { Status } from '../models/pipeline'
import { ProjectWithLatestPipeline } from '../models/project-with-pipeline'
import { ProjectStore, trackRequestsStatus } from '../store/project-store'

@Injectable()
export class ProjectService {
  constructor(
    private readonly projectStore: ProjectStore,
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
      .subscribe((projects) => this.projectStore.update(projects))

    return this.projectStore.projects$
  }

  filteredProjects(): Observable<Record<Status, ProjectWithLatestPipeline[]>> {
    return this.projectStore.foundProjects$
  }

  /**
   * Search for projects inside store
   *
   * @see DashboardStore
   */
  search(query: string): void {
    this.projectStore.search(query)
  }

  isLoading(): Observable<boolean> {
    return this.projectStore.projectsLoading$
  }
}
