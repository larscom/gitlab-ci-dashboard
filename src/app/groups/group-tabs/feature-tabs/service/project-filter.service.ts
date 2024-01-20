import { ProjectWithPipeline, Status } from '$groups/model/pipeline'
import { GroupStore } from '$groups/store/group.store'
import { filterNotNull, filterPipeline, filterProject } from '$groups/util/filter'
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
      this.selectedGroupId$.pipe(switchMap((groupId) => this.pipelineStore.branchFilter(groupId))),
      this.selectedGroupId$.pipe(switchMap((groupId) => this.pipelineStore.topicsFilter(groupId))),
      this.selectedGroupId$.pipe(switchMap((groupId) => this.pipelineStore.statusesFilter(groupId))),
      this.selectedGroupId$.pipe(switchMap((groupId) => this.pipelineStore.pinnedPipelines(groupId)))
    ]).pipe(
      map(([data, projectText, branchText, filterTopics, filterStatuses, pinnedPipelines]) =>
        data
          .filter(({ pipeline, project }) => {
            const filter = filterProject(project, projectText, filterTopics)
            if (pipeline) {
              return filter && filterPipeline(pipeline, branchText, filterStatuses)
            }
            return filter
          })
          .sort((a, b) => {
            const aPinned = pinnedPipelines.includes(Number(a.pipeline?.id))
            const bPinned = pinnedPipelines.includes(Number(b.pipeline?.id))

            if (aPinned && !bPinned) {
              return -1
            }
            if (!aPinned && bPinned) {
              return 1
            }

            return 0
          })
      )
    )
  }
}
