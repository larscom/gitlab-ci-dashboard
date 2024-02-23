import { ProjectLatestPipeline, ProjectPipeline } from '$groups/model/pipeline'
import { GroupStore } from '$groups/store/group.store'
import { filterNotNull, filterPipeline, filterProject } from '$groups/util/filter'
import { Injectable, inject } from '@angular/core'
import { Observable, combineLatest, map, switchMap } from 'rxjs'
import { LatestPipelineStore } from '../latest-pipelines/store/latest-pipeline.store'
import { PipelineStore } from '../pipelines/store/pipeline.store'

@Injectable({ providedIn: 'root' })
export class ProjectFilterService {
  private latestPipelineStore = inject(LatestPipelineStore)
  private pipelineStore = inject(PipelineStore)
  private groupStore = inject(GroupStore)

  private selectedGroupId$ = this.groupStore.selectedGroupId$.pipe(filterNotNull)

  getProjectsLatestPipeline(): Observable<ProjectLatestPipeline[]> {
    return combineLatest([
      this.latestPipelineStore.projectsWithLatestPipeline$,
      this.selectedGroupId$.pipe(switchMap((groupId) => this.latestPipelineStore.projectFilter(groupId))),
      this.selectedGroupId$.pipe(switchMap((groupId) => this.latestPipelineStore.topicsFilter(groupId)))
    ]).pipe(
      map(([data, filterText, filterTopics]) => {
        return data.filter(({ project }) => filterProject(project, filterText, filterTopics))
      })
    )
  }

  getProjectsPipeline(): Observable<ProjectPipeline[]> {
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
          .flatMap(({ project, pipelines }) => pipelines.map((pipeline) => ({ project, pipeline })))
          .filter(({ pipeline, project }) => {
            return (
              filterProject(project, projectText, filterTopics) && filterPipeline(pipeline, branchText, filterStatuses)
            )
          })
          .sort((a, b) => this.sortByUpdatedAt(a, b))
          .sort((a, b) => this.sortPinned(a, b, pinnedPipelines))
      )
    )
  }

  private sortByUpdatedAt(a: ProjectPipeline, b: ProjectPipeline): number {
    return new Date(b.pipeline.updated_at).getTime() - new Date(a.pipeline.updated_at).getTime()
  }

  private sortPinned(a: ProjectPipeline, b: ProjectPipeline, pinnedPipelines: number[]): number {
    const aPinned = pinnedPipelines.includes(Number(a.pipeline?.id))
    const bPinned = pinnedPipelines.includes(Number(b.pipeline?.id))

    if (aPinned && !bPinned) {
      return -1
    }
    if (!aPinned && bPinned) {
      return 1
    }

    return 0
  }
}
