import { ProjectWithPipeline, Status } from '$groups/model/pipeline'
import { GroupStore } from '$groups/store/group.store'
import { filterNotNull, filterProject } from '$groups/util/filter'
import { Injectable } from '@angular/core'
import { Observable, combineLatest, map, switchMap } from 'rxjs'
import { LatestPipelineStore } from '../latest-pipelines/store/latest-pipeline.store'
import { PipelineStore } from '../pipelines/store/pipeline.store'

@Injectable({ providedIn: 'root' })
export class ProjectFilterService {
  private selectedGroupId$ = this.groupStore.selectedGroupId$.pipe(filterNotNull)

  constructor(
    private latestPipelineStore: LatestPipelineStore,
    private pipelineStore: PipelineStore,
    private groupStore: GroupStore
  ) {}

  getProjectsWithLatestPipeline(): Observable<Map<Status, ProjectWithPipeline[]>> {
    return combineLatest([
      this.latestPipelineStore.projectsWithLatestPipeline$,
      this.selectedGroupId$.pipe(switchMap((groupId) => this.latestPipelineStore.projectFilter(groupId))),
      this.selectedGroupId$.pipe(switchMap((groupId) => this.latestPipelineStore.topicsFilter(groupId)))
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
      this.selectedGroupId$.pipe(switchMap((groupId) => this.pipelineStore.projectFilter(groupId))),
      this.selectedGroupId$.pipe(switchMap((groupId) => this.pipelineStore.topicsFilter(groupId)))
    ]).pipe(
      map(([data, filterText, filterTopics]) =>
        data.filter(({ project }) => filterProject(project, filterText, filterTopics))
      )
    )
  }
}
