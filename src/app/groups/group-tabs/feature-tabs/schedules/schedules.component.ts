import { GroupStore } from '$groups/store/group.store'
import { GroupId } from '$groups/model/group'
import { UIStore } from '$store/ui.store'
import { CommonModule } from '@angular/common'
import { Component, OnInit } from '@angular/core'
import { Actions } from '@ngneat/effects-ng'
import { NzSpinModule } from 'ng-zorro-antd/spin'
import { filter, firstValueFrom, map, switchMap, take } from 'rxjs'
import { AutoRefreshComponent } from '../components/auto-refresh/auto-refresh.component'
import { ProjectFilterComponent } from '../components/project-filter/project-filter.component'
import { ScheduleTableComponent } from './schedule-table/schedule-table.component'
import { ScheduleFilterService } from './service/schedule-filter.service'
import { fetchSchedules } from './store/schedule.actions'
import { ScheduleStore } from './store/schedule.store'

@Component({
  selector: 'gcd-schedules',
  standalone: true,
  imports: [CommonModule, NzSpinModule, ScheduleTableComponent, AutoRefreshComponent, ProjectFilterComponent],
  templateUrl: './schedules.component.html',
  styleUrls: ['./schedules.component.scss']
})
export class SchedulesComponent implements OnInit {
  selectedGroupId$ = this.groupStore.selectedGroupId$.pipe(filter((id): id is GroupId => id != null))
  autoRefreshLoading$ = this.selectedGroupId$.pipe(switchMap((groupId) => this.uiStore.autoRefreshLoading(groupId)))

  loading$ = this.scheduleStore.loading$
  schedules$ = this.scheduleFilterService.getSchedules()

  projects$ = this.scheduleStore.schedules$.pipe(map((schedules) => schedules.map(({ project }) => project)))
  currentFilterTopics$ = this.scheduleStore.projectFilterTopics$
  currentFilterText$ = this.scheduleStore.projectFilterText$

  constructor(
    private actions: Actions,
    private scheduleStore: ScheduleStore,
    private scheduleFilterService: ScheduleFilterService,
    private groupStore: GroupStore,
    private uiStore: UIStore
  ) {}

  ngOnInit(): void {
    this.selectedGroupId$.pipe(take(1)).subscribe((groupId) => {
      this.actions.dispatch(fetchSchedules({ groupId }))
    })
  }

  async fetch(): Promise<void> {
    const groupId = await firstValueFrom(this.selectedGroupId$)
    this.actions.dispatch(fetchSchedules({ groupId, withLoader: false }))
  }

  onFilterTopicsChanged(topics: string[]): void {
    this.scheduleStore.setProjectFilterTopics(topics)
  }

  onFilterTextChanged(filterText: string): void {
    this.scheduleStore.setProjectFilterText(filterText)
  }
}
