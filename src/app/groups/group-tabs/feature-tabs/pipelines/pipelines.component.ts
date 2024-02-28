import { GroupId } from '$groups/model/group'
import { PipelineId } from '$groups/model/pipeline'
import { Status } from '$groups/model/status'
import { GroupStore } from '$groups/store/group.store'
import { filterArrayNotNull } from '$groups/util/filter'
import { UIStore } from '$store/ui.store'
import { CommonModule } from '@angular/common'
import { Component, OnInit, computed, inject } from '@angular/core'
import { NzSpinModule } from 'ng-zorro-antd/spin'
import { AutoRefreshComponent } from '../components/auto-refresh/auto-refresh.component'
import { ProjectFilterComponent } from '../components/project-filter/project-filter.component'
import { TopicFilterComponent } from '../components/topic-filter/topic-filter.component'
import { BranchFilterComponent } from './components/branch-filter/branch-filter.component'
import { StatusFilterComponent } from './components/status-filter/status-filter.component'
import { PipelineTableComponent } from './pipeline-table/pipeline-table.component'
import { ProjectFilterService } from './service/project-filter.service'
import { PipelineStore } from './store/pipeline.store'

@Component({
  selector: 'gcd-pipelines',
  standalone: true,
  imports: [
    CommonModule,
    NzSpinModule,
    ProjectFilterComponent,
    TopicFilterComponent,
    BranchFilterComponent,
    StatusFilterComponent,
    PipelineTableComponent,
    AutoRefreshComponent
  ],
  templateUrl: './pipelines.component.html',
  styleUrls: ['./pipelines.component.scss']
})
export class PipelinesComponent implements OnInit {
  private groupStore = inject(GroupStore)
  private pipelineStore = inject(PipelineStore)
  private uiStore = inject(UIStore)
  private filterService = inject(ProjectFilterService)

  projectPipelines = this.filterService.projectPipelines
  pipelinesLoading = this.pipelineStore.loading
  selectedGroupId = this.groupStore.selectedGroupId

  autoRefreshLoading = computed(() => {
    const groupId = this.groupStore.selectedGroupId()
    return groupId ? this.uiStore.getAutoRefreshLoading(groupId)() : false
  })

  selectedFilterTopics = computed(() => {
    const groupId = this.groupStore.selectedGroupId()
    return groupId ? this.pipelineStore.getTopicsFilter(groupId)() : []
  })

  selectedFilterTextProjects = computed(() => {
    const groupId = this.groupStore.selectedGroupId()
    return groupId ? this.pipelineStore.getProjectFilter(groupId)() : ''
  })
  selectedFilterTextBranches = computed(() => {
    const groupId = this.groupStore.selectedGroupId()
    return groupId ? this.pipelineStore.getBranchFilter(groupId)() : ''
  })

  selectedFilterStatuses = computed(() => {
    const groupId = this.groupStore.selectedGroupId()
    return groupId ? this.pipelineStore.getStatusesFilter(groupId)() : []
  })

  pinnedPipelines = computed(() => {
    const groupId = this.groupStore.selectedGroupId()
    return groupId ? this.pipelineStore.getPinnedPipelines(groupId)() : []
  })

  projects = computed(() => {
    return this.pipelineStore
      .projectPipelines()
      .filter(({ pipelines }) => pipelines.length > 0)
      .map(({ project }) => project)
  })
  branches = computed(() => {
    return filterArrayNotNull(
      this.pipelineStore.projectPipelines().flatMap(({ pipelines }) => pipelines.map(({ ref }) => ref))
    )
  })

  ngOnInit(): void {
    const groupId = this.groupStore.selectedGroupId()
    if (groupId) {
      this.pipelineStore.fetch(groupId)
    }
  }

  fetch(groupId: GroupId): void {
    this.pipelineStore.fetch(groupId, false)
  }

  async onFilterTopicsChanged(topics: string[]): Promise<void> {
    const groupId = this.groupStore.selectedGroupId()
    if (groupId) {
      this.pipelineStore.setTopicsFilter(groupId, topics)
    }
  }

  async onFilterTextProjectsChanged(filterText: string): Promise<void> {
    const groupId = this.groupStore.selectedGroupId()
    if (groupId) {
      this.pipelineStore.setProjectFilter(groupId, filterText)
    }
  }

  async onFilterTextBranchesChanged(filterText: string): Promise<void> {
    const groupId = this.groupStore.selectedGroupId()
    if (groupId) {
      this.pipelineStore.setBranchFilter(groupId, filterText)
    }
  }

  async onFilterStatusesChanged(statuses: Status[]): Promise<void> {
    const groupId = this.groupStore.selectedGroupId()
    if (groupId) {
      this.pipelineStore.setStatusesFilter(groupId, statuses)
    }
  }

  async onPinnedPipelinesChanged(pinnedPipelines: PipelineId[]): Promise<void> {
    const groupId = this.groupStore.selectedGroupId()
    if (groupId) {
      this.pipelineStore.setPinnedPipelines(groupId, pinnedPipelines)
    }
  }
}
