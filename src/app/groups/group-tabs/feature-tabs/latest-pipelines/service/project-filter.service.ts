import { ProjectWithLatestPipeline, Status } from '$groups/model/pipeline'
import { filterProject } from '$groups/util/filter'
import { Injectable } from '@angular/core'
import { Observable, combineLatest, map } from 'rxjs'
import { LatestPipelineStore } from '../store/latest-pipeline.store'

@Injectable({ providedIn: 'root' })
export class ProjectFilterService {
  constructor(private store: LatestPipelineStore) {}

  getProjectsWithLatestPipeline(): Observable<Map<Status, ProjectWithLatestPipeline[]>> {
    return combineLatest([
      this.store.projectsWithLatestPipeline$,
      this.store.projectFilterText$,
      this.store.projectFilterTopics$
    ]).pipe(
      map(([data, filterText, filterTopics]) => {
        return Array.from(data).reduce((current, [status, projects]) => {
          const filtered = projects.filter(({ project }) => filterProject(project, filterText, filterTopics))
          return filtered.length ? current.set(status, filtered) : current
        }, new Map<Status, ProjectWithLatestPipeline[]>())
      })
    )
  }
}
