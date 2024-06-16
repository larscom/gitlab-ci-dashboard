import { FETCH_REFRESH_INTERVAL } from '$groups/http'
import { GroupId } from '$groups/model/group'
import { ProjectId } from '$groups/model/project'
import { ScheduleProjectPipeline } from '$groups/model/schedule'
import { Status } from '$groups/model/status'
import { filterPipeline, filterProject } from '$groups/util/filter'
import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, computed, inject, input, signal } from '@angular/core'
import { takeUntilDestroyed } from '@angular/core/rxjs-interop'
import { NzSpinModule } from 'ng-zorro-antd/spin'
import { forkJoin, interval, map, switchMap } from 'rxjs'
import { ProjectFilterComponent } from '../components/project-filter/project-filter.component'
import { TopicFilterComponent } from '../components/topic-filter/topic-filter.component'
import { StatusFilterComponent } from '../pipelines/components/status-filter/status-filter.component'
import { ScheduleTableComponent } from './schedule-table/schedule-table.component'
import { ScheduleService } from './service/schedule.service'

@Component({
  selector: 'gcd-schedules',
  standalone: true,
  imports: [
    CommonModule,
    NzSpinModule,
    ScheduleTableComponent,
    ProjectFilterComponent,
    TopicFilterComponent,
    StatusFilterComponent
  ],
  templateUrl: './schedules.component.html',
  styleUrls: ['./schedules.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SchedulesComponent implements OnInit {
  private scheduleService = inject(ScheduleService)
  private destroyRef = inject(DestroyRef)

  groupMap = input.required<Map<GroupId, Set<ProjectId>>>()

  filterText = signal('')
  filterTopics = signal<string[]>([])
  filterStatuses = signal<Status[]>([])

  schedulePipelines = signal<ScheduleProjectPipeline[]>([])
  loading = signal(false)

  filteredSchedulePipelines = computed(() => {
    return this.schedulePipelines().filter(({ project, pipeline }) => {
      const filter = filterProject(project, this.filterText(), this.filterTopics())
      if (pipeline) {
        return filter && filterPipeline(pipeline, '', this.filterStatuses())
      }
      return filter
    })
  })

  projects = computed(() => {
    const schedules = this.schedulePipelines()
    return schedules.map(({ project }) => project)
  })

  ngOnInit(): void {
    this.loading.set(true)
    forkJoin(
      Array.from(this.groupMap().entries()).map(([groupId, projectIds]) => {
        return this.scheduleService.getSchedules(groupId, projectIds)
      })
    )
      .pipe(map((all) => all.flat()))
      .subscribe((schedulePipelines) => {
        this.loading.set(false)
        this.schedulePipelines.set(schedulePipelines)
      })

    interval(FETCH_REFRESH_INTERVAL)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        switchMap(() =>
          forkJoin(
            Array.from(this.groupMap().entries()).map(([groupId, projectIds]) => {
              return this.scheduleService.getSchedules(groupId, projectIds)
            })
          ).pipe(map((all) => all.flat()))
        )
      )
      .subscribe((schedulePipelines) => this.schedulePipelines.set(schedulePipelines))
  }

  onFilterTopicsChanged(topics: string[]) {
    this.filterTopics.set(topics)
  }

  onFilterTextChanged(filterText: string) {
    this.filterText.set(filterText)
  }

  onFilterStatusesChanged(statuses: Status[]) {
    this.filterStatuses.set(statuses)
  }
}
