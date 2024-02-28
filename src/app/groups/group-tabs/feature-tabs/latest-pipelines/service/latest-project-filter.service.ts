import { GroupId } from '$groups/model/group'
import { ProjectLatestPipeline } from '$groups/model/pipeline'
import { GroupStore } from '$groups/store/group.store'
import { filterProject } from '$groups/util/filter'
import { Injectable, Signal, computed, inject } from '@angular/core'
import { LatestPipelineStore } from '../store/latest-pipeline.store'

@Injectable({ providedIn: 'root' })
export class LatestProjectFilterService {
  private latestPipelineStore = inject(LatestPipelineStore)
  private groupStore = inject(GroupStore)

  projectsLatestPipeline: Signal<ProjectLatestPipeline[]> = computed(() => {
    const groupId = this.groupStore.selectedGroupId()
    return groupId ? this.filter(groupId) : []
  })

  private filter(groupId: GroupId): ProjectLatestPipeline[] {
    const projects = this.latestPipelineStore.projectsLatestPipelines()
    const filterText = this.latestPipelineStore.getProjectFilter(groupId)()
    const filterTopics = this.latestPipelineStore.getTopicsFilter(groupId)()
    return projects.filter(({ project }) => filterProject(project, filterText, filterTopics))
  }
}
