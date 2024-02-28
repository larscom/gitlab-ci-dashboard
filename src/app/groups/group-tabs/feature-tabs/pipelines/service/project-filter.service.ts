import { GroupId } from '$groups/model/group'
import { ProjectPipeline } from '$groups/model/pipeline'
import { GroupStore } from '$groups/store/group.store'
import { filterPipeline, filterProject } from '$groups/util/filter'
import { Injectable, Signal, computed, inject } from '@angular/core'
import { PipelineStore } from '../store/pipeline.store'

@Injectable({ providedIn: 'root' })
export class ProjectFilterService {
  private pipelineStore = inject(PipelineStore)
  private groupStore = inject(GroupStore)

  projectPipelines: Signal<ProjectPipeline[]> = computed(() => {
    const groupId = this.groupStore.selectedGroupId()
    return groupId ? this.filter(groupId) : []
  })

  private filter(groupId: GroupId): ProjectPipeline[] {
    const projectText = this.pipelineStore.getProjectFilter(groupId)()
    const branchText = this.pipelineStore.getBranchFilter(groupId)()
    const filterTopics = this.pipelineStore.getTopicsFilter(groupId)()
    const filterStatuses = this.pipelineStore.getStatusesFilter(groupId)()
    const pinnedPipelines = this.pipelineStore.getPinnedPipelines(groupId)()

    return this.pipelineStore
      .projectPipelines()
      .flatMap(({ project, pipelines }) => pipelines.map((pipeline) => ({ project, pipeline })))
      .filter(({ pipeline, project }) => {
        return filterProject(project, projectText, filterTopics) && filterPipeline(pipeline, branchText, filterStatuses)
      })
      .sort((a, b) => this.sortByUpdatedAt(a, b))
      .sort((a, b) => this.sortPinned(a, b, pinnedPipelines))
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
