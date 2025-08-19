import { FETCH_REFRESH_INTERVAL } from '$groups/http'
import { GroupId } from '$groups/model/group'
import { ProjectId } from '$groups/model/project'
import { ScheduleProjectPipeline } from '$groups/model/schedule'
import { Status } from '$groups/model/status'
import { filterFailedJobs, filterPipeline, filterProject } from '$groups/util/filter'
import { forkJoinFlatten } from '$groups/util/fork'
import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, computed, inject, input, signal } from '@angular/core'
import { takeUntilDestroyed } from '@angular/core/rxjs-interop'
import { NzSpinModule } from 'ng-zorro-antd/spin'
import { finalize, interval, switchMap } from 'rxjs'
import { JobFilterComponent } from '../components/job-filter/job-filter.component'
import { ProjectFilterComponent } from '../components/project-filter/project-filter.component'
import { TopicFilterComponent } from '../components/topic-filter/topic-filter.component'
import { StatusFilterComponent } from '../pipelines/components/status-filter/status-filter.component'
import { ScheduleTableComponent } from './schedule-table/schedule-table.component'
import { ScheduleService } from './service/schedule.service'

@Component({
  selector: 'gcd-schedules',
  imports: [
    CommonModule,
    NzSpinModule,
    ScheduleTableComponent,
    ProjectFilterComponent,
    TopicFilterComponent,
    StatusFilterComponent,
    JobFilterComponent
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
  filterJobs = signal<string[]>([])

  schedulePipelines = signal<ScheduleProjectPipeline[]>([])
  loading = signal(false)

  jobs = computed(() => this.schedulePipelines().flatMap(({ jobs }) => jobs ?? []))

  filteredSchedulePipelines = computed(() => {
    return this.schedulePipelines()
      .filter(({ project, pipeline }) => {
        const filter = filterProject(project, this.filterText(), this.filterTopics())
        if (pipeline) {
          return filter && filterPipeline(pipeline, '', this.filterStatuses())
        }
        return filter
      })
      .filter(({ jobs }) => filterFailedJobs(jobs ?? [], this.filterJobs()))
  })

  projects = computed(() => {
    const schedules = this.schedulePipelines()
    return schedules.map(({ project }) => project)
  })

  ngOnInit(): void {
    this.loading.set(true)

    forkJoinFlatten(this.groupMap(), this.scheduleService.getSchedules.bind(this.scheduleService))
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe((schedulePipelines) => this.schedulePipelines.set(schedulePipelines))

    interval(FETCH_REFRESH_INTERVAL)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        switchMap(() => forkJoinFlatten(this.groupMap(), this.scheduleService.getSchedules.bind(this.scheduleService)))
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

  onFilterJobsChanged(jobs: string[]): void {
    this.filterJobs.set(jobs)
  }
}
