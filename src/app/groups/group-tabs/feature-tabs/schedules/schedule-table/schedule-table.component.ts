import { StatusColorPipe } from '$groups/group-tabs/feature-tabs/pipes/status-color.pipe'
import { Pipeline } from '$groups/model/pipeline'
import { ScheduleId, ScheduleWithProjectAndPipeline } from '$groups/model/schedule'
import { compareString, compareStringDate } from '$groups/util/compare'
import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, Input } from '@angular/core'
import { NzBadgeModule } from 'ng-zorro-antd/badge'
import { NzButtonModule } from 'ng-zorro-antd/button'
import { NzI18nService } from 'ng-zorro-antd/i18n'
import { NzIconModule } from 'ng-zorro-antd/icon'
import { NzTableModule } from 'ng-zorro-antd/table'
import { NzToolTipModule } from 'ng-zorro-antd/tooltip'

interface Header<T> {
  title: string
  sortable: boolean
  compare: ((a: T, b: T) => number) | null
}

@Component({
  selector: 'gcd-schedule-table',
  standalone: true,
  imports: [CommonModule, NzTableModule, NzToolTipModule, NzButtonModule, NzIconModule, NzBadgeModule, StatusColorPipe],
  templateUrl: './schedule-table.component.html',
  styleUrls: ['./schedule-table.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ScheduleTableComponent {
  @Input({ required: true }) schedules!: ScheduleWithProjectAndPipeline[]

  headers: Header<ScheduleWithProjectAndPipeline>[] = [
    { title: 'Project', sortable: true, compare: (a, b) => compareString(a.project.name, b.project.name) },
    {
      title: 'Description',
      sortable: true,
      compare: (a, b) => compareString(a.schedule.description, b.schedule.description)
    },
    { title: 'Target', sortable: false, compare: null },
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
      compare: (a, b) => compareString(a.latest_pipeline?.status, b.latest_pipeline?.status)
    }
  ]

  constructor(private i18n: NzI18nService) {}

  get locale(): string {
    const { locale } = this.i18n.getLocale()
    return locale
  }

  get timeZone(): string {
    const { timeZone } = Intl.DateTimeFormat().resolvedOptions()
    return timeZone
  }

  onActionClick(e: Event, { web_url }: Pipeline): void {
    e.stopPropagation()
    window.open(web_url, '_blank')
  }

  trackByScheduleId(_: number, { schedule: { id } }: ScheduleWithProjectAndPipeline): ScheduleId {
    return id
  }
}
