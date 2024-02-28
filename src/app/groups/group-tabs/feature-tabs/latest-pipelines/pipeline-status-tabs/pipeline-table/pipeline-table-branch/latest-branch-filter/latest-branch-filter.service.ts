import { LatestPipelineStore } from '$groups/group-tabs/feature-tabs/latest-pipelines/store/latest-pipeline.store'
import { GroupId } from '$groups/model/group'
import { BranchLatestPipeline } from '$groups/model/pipeline'
import { GroupStore } from '$groups/store/group.store'
import { filterString } from '$groups/util/filter'
import { Injectable, Signal, computed, inject } from '@angular/core'

@Injectable({ providedIn: 'root' })
export class LatestBranchFilterService {
  private latestPipelineStore = inject(LatestPipelineStore)
  private groupStore = inject(GroupStore)

  branchesLatestPipeline: Signal<BranchLatestPipeline[]> = computed(() => {
    const groupId = this.groupStore.selectedGroupId()
    return groupId ? this.filter(groupId) : []
  })

  private filter(groupId: GroupId): BranchLatestPipeline[] {
    const branches = this.latestPipelineStore.branchesLatestPipelines()
    const filterText = this.latestPipelineStore.getBranchFilter(groupId)()
    return branches.filter(({ branch: { name } }) => filterString(name, filterText))
  }
}
