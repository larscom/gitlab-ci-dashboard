import { GroupId } from '$groups/model/group'
import { GroupStore } from '$groups/store/group.store'
import { UIStore } from '$store/ui.store'
import { CommonModule } from '@angular/common'
import { Component, OnInit, computed, inject } from '@angular/core'
import { NzSpinModule } from 'ng-zorro-antd/spin'
import { AutoRefreshComponent } from '../components/auto-refresh/auto-refresh.component'
import { ProjectFilterComponent } from '../components/project-filter/project-filter.component'
import { TopicFilterComponent } from '../components/topic-filter/topic-filter.component'
import { PipelineStatusTabsComponent } from './pipeline-status-tabs/pipeline-status-tabs.component'
import { LatestPipelineStore } from './store/latest-pipeline.store'

@Component({
  selector: 'gcd-latest-pipelines',
  standalone: true,
  imports: [
    CommonModule,
    NzSpinModule,
    PipelineStatusTabsComponent,
    ProjectFilterComponent,
    TopicFilterComponent,
    AutoRefreshComponent
  ],
  templateUrl: './latest-pipelines.component.html',
  styleUrls: ['./latest-pipelines.component.scss']
})
export class LatestPipelinesComponent implements OnInit {
  private groupStore = inject(GroupStore)
  private latestPipelineStore = inject(LatestPipelineStore)
  private uiStore = inject(UIStore)

  selectedGroupId = this.groupStore.selectedGroupId

  autoRefreshLoading = computed(() => {
    const groupId = this.groupStore.selectedGroupId()
    return groupId ? this.uiStore.getAutoRefreshLoading(groupId)() : false
  })

  selectedFilterTopics = computed(() => {
    const groupId = this.groupStore.selectedGroupId()
    return groupId ? this.latestPipelineStore.getTopicsFilter(groupId)() : []
  })

  selectedFilterText = computed(() => {
    const groupId = this.groupStore.selectedGroupId()
    return groupId ? this.latestPipelineStore.getProjectFilter(groupId)() : ''
  })

  projectsLoading = this.latestPipelineStore.projectsLoading

  projects = computed(() => {
    const projects = this.latestPipelineStore.projectsLatestPipelines()
    return projects.filter(({ pipeline }) => pipeline != null).map(({ project }) => project)
  })

  ngOnInit(): void {
    const groupId = this.groupStore.selectedGroupId()
    if (groupId) {
      this.latestPipelineStore.fetchProjects(groupId)
    }
  }

  fetch(groupId: GroupId): void {
    this.latestPipelineStore.fetchProjects(groupId, false)
  }

  onFilterTopicsChanged(topics: string[]): void {
    const groupId = this.groupStore.selectedGroupId()
    if (groupId) {
      this.latestPipelineStore.setTopicsFilter(groupId, topics)
    }
  }

  onFilterTextChanged(filterText: string): void {
    const groupId = this.groupStore.selectedGroupId()
    if (groupId) {
      this.latestPipelineStore.setProjectFilter(groupId, filterText)
    }
  }
}
