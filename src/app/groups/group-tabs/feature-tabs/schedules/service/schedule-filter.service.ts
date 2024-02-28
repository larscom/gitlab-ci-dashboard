import { GroupId } from '$groups/model/group'
import { ScheduleProjectLatestPipeline } from '$groups/model/schedule'
import { GroupStore } from '$groups/store/group.store'
import { filterPipeline, filterProject } from '$groups/util/filter'
import { Injectable, Signal, computed, inject } from '@angular/core'
import { ScheduleStore } from '../store/schedule.store'

@Injectable({ providedIn: 'root' })
export class ScheduleFilterService {
  private scheduleStore = inject(ScheduleStore)
  private groupStore = inject(GroupStore)

  schedules: Signal<ScheduleProjectLatestPipeline[]> = computed(() => {
    const groupId = this.groupStore.selectedGroupId()
    return groupId ? this.filter(groupId) : []
  })

  private filter(groupId: GroupId): ScheduleProjectLatestPipeline[] {
    const schedules = this.scheduleStore.schedules()
    const filterText = this.scheduleStore.getProjectFilter(groupId)()
    const filterTopics = this.scheduleStore.getTopicsFilter(groupId)()
    const filterStatuses = this.scheduleStore.getStatusesFilter(groupId)()

    return schedules.filter(({ project, pipeline }) => {
      const filter = filterProject(project, filterText, filterTopics)
      if (pipeline) {
        return filter && filterPipeline(pipeline, '', filterStatuses)
      }
      return filter
    })
  }
}
