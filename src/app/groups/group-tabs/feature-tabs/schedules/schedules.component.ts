import { GroupId } from '$groups/model/group'
import { Status } from '$groups/model/status'
import { GroupStore } from '$groups/store/group.store'
import { UIStore } from '$store/ui.store'
import { CommonModule } from '@angular/common'
import { Component, OnInit, computed, inject } from '@angular/core'
import { NzSpinModule } from 'ng-zorro-antd/spin'
import { AutoRefreshComponent } from '../components/auto-refresh/auto-refresh.component'
import { ProjectFilterComponent } from '../components/project-filter/project-filter.component'
import { TopicFilterComponent } from '../components/topic-filter/topic-filter.component'
import { StatusFilterComponent } from '../pipelines/components/status-filter/status-filter.component'
import { ScheduleTableComponent } from './schedule-table/schedule-table.component'
import { ScheduleFilterService } from './service/schedule-filter.service'
import { ScheduleStore } from './store/schedule.store'

@Component({
  selector: 'gcd-schedules',
  standalone: true,
  imports: [
    CommonModule,
    NzSpinModule,
    ScheduleTableComponent,
    AutoRefreshComponent,
    ProjectFilterComponent,
    TopicFilterComponent,
    StatusFilterComponent
  ],
  templateUrl: './schedules.component.html',
  styleUrls: ['./schedules.component.scss']
})
export class SchedulesComponent implements OnInit {
  private groupStore = inject(GroupStore)
  private scheduleStore = inject(ScheduleStore)
  private uiStore = inject(UIStore)
  private scheduleFilterService = inject(ScheduleFilterService)

  schedulesLoading = this.scheduleStore.loading

  selectedGroupId = this.groupStore.selectedGroupId
  autoRefreshLoading = computed(() => {
    const groupId = this.groupStore.selectedGroupId()
    return groupId ? this.uiStore.getAutoRefreshLoading(groupId)() : false
  })

  schedules = this.scheduleFilterService.schedules

  projects = computed(() => {
    const schedules = this.scheduleStore.schedules()
    return schedules.map(({ project }) => project)
  })

  selectedFilterTopics = computed(() => {
    const groupId = this.groupStore.selectedGroupId()
    return groupId ? this.scheduleStore.getTopicsFilter(groupId)() : []
  })

  selectedFilterText = computed(() => {
    const groupId = this.groupStore.selectedGroupId()
    return groupId ? this.scheduleStore.getProjectFilter(groupId)() : ''
  })

  selectedFilterStatuses = computed(() => {
    const groupId = this.groupStore.selectedGroupId()
    return groupId ? this.scheduleStore.getStatusesFilter(groupId)() : []
  })

  ngOnInit(): void {
    const groupId = this.groupStore.selectedGroupId()
    if (groupId) {
      this.scheduleStore.fetch(groupId)
    }
  }

  fetch(groupId: GroupId): void {
    this.scheduleStore.fetch(groupId, false)
  }

  async onFilterTopicsChanged(topics: string[]): Promise<void> {
    const groupId = this.groupStore.selectedGroupId()
    if (groupId) {
      this.scheduleStore.setTopicsFilter(groupId, topics)
    }
  }

  async onFilterTextChanged(filterText: string): Promise<void> {
    const groupId = this.groupStore.selectedGroupId()
    if (groupId) {
      this.scheduleStore.setProjectFilter(groupId, filterText)
    }
  }

  async onFilterStatusesChanged(statuses: Status[]): Promise<void> {
    const groupId = this.groupStore.selectedGroupId()
    if (groupId) {
      this.scheduleStore.setStatusesFilter(groupId, statuses)
    }
  }
}
