import { GroupId } from '$groups/model/group'
import { UIStore } from '$store/ui.store'
import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, Input, OnInit } from '@angular/core'
import { Actions } from '@ngneat/effects-ng'
import { NzSpinModule } from 'ng-zorro-antd/spin'
import { Observable, map } from 'rxjs'
import { AutoRefreshComponent } from '../components/auto-refresh/auto-refresh.component'
import { ProjectFilterComponent } from '../components/project-filter/project-filter.component'
import { ScheduleTableComponent } from './schedule-table/schedule-table.component'
import { ScheduleFilterService } from './service/schedule-filter.service'
import { fetchSchedules, resetAllFilters } from './store/schedule.actions'
import { ScheduleStore } from './store/schedule.store'

@Component({
  selector: 'gcd-schedules',
  standalone: true,
  imports: [CommonModule, NzSpinModule, ScheduleTableComponent, AutoRefreshComponent, ProjectFilterComponent],
  templateUrl: './schedules.component.html',
  styleUrls: ['./schedules.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SchedulesComponent implements OnInit {
  @Input({ required: true }) selectedGroupId!: GroupId

  autoRefreshLoading$!: Observable<boolean>

  loading$ = this.scheduleStore.loading$
  schedules$ = this.scheduleFilterService.getSchedules()
  projects$ = this.scheduleStore.schedules$.pipe(map((schedules) => schedules.map(({ project }) => project)))
  currentFilterTopics$ = this.scheduleStore.projectFilterTopics$
  currentFilterText$ = this.scheduleStore.projectFilterText$

  constructor(
    private actions: Actions,
    private scheduleStore: ScheduleStore,
    private uiStore: UIStore,
    private scheduleFilterService: ScheduleFilterService
  ) {}

  ngOnInit(): void {
    const { selectedGroupId: groupId } = this

    this.autoRefreshLoading$ = this.uiStore.autoRefreshLoading(groupId)
    this.actions.dispatch(resetAllFilters())
    this.actions.dispatch(fetchSchedules({ groupId }))
  }

  async fetch(): Promise<void> {
    const { selectedGroupId: groupId } = this
    this.actions.dispatch(fetchSchedules({ groupId, withLoader: false }))
  }

  onFilterTopicsChanged(topics: string[]): void {
    this.scheduleStore.setProjectFilterTopics(topics)
  }

  onFilterTextChanged(filterText: string): void {
    this.scheduleStore.setProjectFilterText(filterText)
  }
}
