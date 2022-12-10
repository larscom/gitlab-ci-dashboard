import { filterBy } from '@/app/shared/util/filters'
import { HttpClient } from '@angular/common/http'
import { Injectable } from '@angular/core'
import { combineLatest, firstValueFrom, map, Observable } from 'rxjs'
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

  isLoading(): Observable<boolean> {
    return this.projectStore.projectsLoading$
  }

  /**
   * Fetch Projects with Pipelines from API and save to store
   *
   * @see ProjectStore
   */
  async fetchProjects(groupId: GroupId): Promise<void> {
    const projects = await firstValueFrom(
      this.http
        .get<Record<Status, ProjectWithLatestPipeline[]>>(
          `${location.origin}/api/groups/${groupId}/projects`
        )
        .pipe(trackRequestsStatus('projects'))
    )
    this.projectStore.setProjects(projects)
  }

  /**
   * Get all projects filtered by name or topics
   *
   * @see ProjectStore
   */
  getFilteredProjects(): Observable<
    Record<Status, ProjectWithLatestPipeline[]>
  > {
    return combineLatest([
      this.projectStore.filterText$,
      this.projectStore.projects$,
      this.projectStore.filterTopics$,
    ]).pipe(
      map(([filterText, all, filterTopics]) => {
        return Object.keys(all).reduce((result, status) => {
          const projects: ProjectWithLatestPipeline[] = Object(all)[status]
          return {
            ...result,
            [status]: projects
              .filter(({ project: { topics } }) => {
                if (!filterTopics.length) return true
                return filterTopics
                  .map((filter) => topics.includes(filter))
                  .every((b) => b)
              })
              .filter(({ project: { name } }) => {
                return filterBy(name, filterText)
              }),
          }
        }, {} as Record<Status, ProjectWithLatestPipeline[]>)
      })
    )
  }

  /**
   * Get all known topics from all projects
   */
  getTopics(): Observable<Set<string>> {
    return this.projectStore.projects$.pipe(
      map((projects) => {
        return new Set(
          Object.values(projects)
            .flat()
            .flatMap(({ project }) => project.topics)
        )
      })
    )
  }

  /**
   * Set filter to filter projects inside store
   *
   * @see ProjectStore
   */
  setFilterTopics(topics: string[]): void {
    this.projectStore.setFilterTopics(topics)
  }

  /**
   * Set filter to filter projects inside store
   *
   * @see ProjectStore
   */
  setFilterText(filterText: string): void {
    this.projectStore.setFilterText(filterText)
  }
}
