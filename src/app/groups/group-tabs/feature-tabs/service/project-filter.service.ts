import { ProjectWithPipeline, Status } from '$groups/model/pipeline'
import { filterProject } from '$groups/util/filter'
import { Injectable } from '@angular/core'
import { Observable, combineLatest, map } from 'rxjs'
import { LatestPipelineStore } from '../latest-pipelines/store/latest-pipeline.store'
import { PipelineStore } from '../pipelines/store/pipeline.store'

@Injectable({ providedIn: 'root' })
export class ProjectFilterService {
  constructor(private latestPipelineStore: LatestPipelineStore, private pipelineStore: PipelineStore) {}

  getProjectsWithLatestPipeline(): Observable<Map<Status, ProjectWithPipeline[]>> {
    return combineLatest([
      this.latestPipelineStore.projectsWithLatestPipeline$,
      this.latestPipelineStore.projectFilterText$,
      this.latestPipelineStore.projectFilterTopics$
    ]).pipe(
      map(([data, filterText, filterTopics]) => {
        return Array.from(data).reduce((current, [status, projects]) => {
          const filtered = projects.filter(({ project }) => filterProject(project, filterText, filterTopics))
          return filtered.length ? current.set(status, filtered) : current
        }, new Map<Status, ProjectWithPipeline[]>())
      })
    )
  }

  getProjectsWithPipeline(): Observable<ProjectWithPipeline[]> {
    return combineLatest([
      this.pipelineStore.projectsWithPipeline$,
      this.pipelineStore.projectFilterText$,
      this.pipelineStore.projectFilterTopics$
    ]).pipe(
      map(([data, filterText, filterTopics]) =>
        data.filter(({ project }) => filterProject(project, filterText, filterTopics))
      )
    )
  }
}
