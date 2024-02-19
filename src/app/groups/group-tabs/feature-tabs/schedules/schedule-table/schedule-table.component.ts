import { StatusColorPipe } from '$groups/group-tabs/feature-tabs/pipes/status-color.pipe'
import { Pipeline } from '$groups/model/pipeline'
import { Project } from '$groups/model/project'
import { ScheduleId, ScheduleWithProjectAndPipeline } from '$groups/model/schedule'
import { Status } from '$groups/model/status'
import { compareString, compareStringDate } from '$groups/util/compare'
import { statusToScope } from '$groups/util/status-scope'
import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core'
import { NzBadgeModule } from 'ng-zorro-antd/badge'
import { NzButtonModule } from 'ng-zorro-antd/button'
import { NzI18nService } from 'ng-zorro-antd/i18n'
import { NzIconModule } from 'ng-zorro-antd/icon'
import { NzTableModule } from 'ng-zorro-antd/table'
import { NzToolTipModule } from 'ng-zorro-antd/tooltip'
import { JobsComponent } from '../../components/jobs/jobs.component'
import { NextRunAtPipe } from './pipes/next-run-at.pipe'

interface Header<T> {
  title: string
  sortable: boolean
  compare: ((a: T, b: T) => number) | null
}

@Component({
  selector: 'gcd-schedule-table',
  standalone: true,
  imports: [
    CommonModule,
    NzTableModule,
    NzToolTipModule,
    NzButtonModule,
    NzIconModule,
    NzBadgeModule,
    NextRunAtPipe,
    StatusColorPipe,
    JobsComponent
  ],
  templateUrl: './schedule-table.component.html',
  styleUrls: ['./schedule-table.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ScheduleTableComponent {
  schedules = input.required<ScheduleWithProjectAndPipeline[]>()

  i18n = inject(NzI18nService)

  headers: Header<ScheduleWithProjectAndPipeline>[] = [
    { title: 'Project', sortable: true, compare: (a, b) => compareString(a.project.name, b.project.name) },
    {
      title: 'Description',
      sortable: true,
      compare: (a, b) => compareString(a.schedule.description, b.schedule.description)
    },
    { title: 'Branch', sortable: false, compare: null },
    {
      title: 'Next Run',
      sortable: true,
      compare: (a, b) => compareStringDate(a.schedule.next_run_at, b.schedule.next_run_at)
    },
    {
      title: 'Owner',
      sortable: true,
      compare: (a, b) => compareString(a.schedule.owner.name, b.schedule.owner.name)
    },
    {
      title: 'Status',
      sortable: true,
      compare: (a, b) => compareString(a.pipeline?.status, b.pipeline?.status)
    }
  ]

  get locale(): string {
    const { locale } = this.i18n.getLocale()
    return locale
  }

  get timeZone(): string {
    const { timeZone } = Intl.DateTimeFormat().resolvedOptions()
    return timeZone
  }

  getScope(status?: Status): Status[] {
    return statusToScope(status)
  }

  onPipelineClick(e: Event, { web_url }: Pipeline): void {
    e.stopPropagation()
    window.open(web_url, '_blank')
  }

  onScheduleClick(e: Event, { web_url }: Project): void {
    e.stopPropagation()
    window.open(`${web_url}/-/pipeline_schedules`, '_blank')
  }

  trackByScheduleId(_: number, { schedule: { id } }: ScheduleWithProjectAndPipeline): ScheduleId {
    return id
  }
}
