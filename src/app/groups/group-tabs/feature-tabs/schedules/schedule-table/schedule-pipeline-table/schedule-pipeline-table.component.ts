import { FavoritesIconComponent } from '$groups/group-tabs/favorites/favorites-icon/favorites-icon.component'
import { CancelPipelineIconComponent } from '$groups/group-tabs/feature-tabs/components/cancel-pipeline-icon/cancel-pipeline-icon.component'
import { JobsComponent } from '$groups/group-tabs/feature-tabs/components/jobs/jobs.component'
import { RetryPipelineIconComponent } from '$groups/group-tabs/feature-tabs/components/retry-pipeline-icon/retry-pipeline-icon.component'
import { StartPipelineIconComponent } from '$groups/group-tabs/feature-tabs/components/start-pipeline-icon/start-pipeline-icon.component'
import { StatusColorPipe } from '$groups/group-tabs/feature-tabs/pipes/status-color.pipe'
import { Pipeline, PipelineId } from '$groups/model/pipeline'
import { Status } from '$groups/model/status'
import { compareString, compareStringDate } from '$groups/util/compare'
import { statusToScope } from '$groups/util/status-scope'
import { Header } from '$groups/util/table'
import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core'
import { NzBadgeModule } from 'ng-zorro-antd/badge'
import { NzButtonModule } from 'ng-zorro-antd/button'
import { NzI18nService } from 'ng-zorro-antd/i18n'
import { NzIconModule } from 'ng-zorro-antd/icon'
import { NzTableModule } from 'ng-zorro-antd/table'
import { NzToolTipModule } from 'ng-zorro-antd/tooltip'

const headers: Header<Pipeline>[] = [
  {
    title: 'Branch',
    sortable: true,
    compare: (a, b) => compareString(a.ref, b.ref)
  },
  {
    title: 'Trigger',
    sortable: true,
    compare: (a, b) => compareString(a.source, b.source)
  },
  {
    title: 'Last Run',
    sortable: true,
    compare: (a, b) => compareStringDate(a.updated_at, b.updated_at)
  },
  {
    title: 'Status',
    sortable: true,
    compare: (a, b) => compareString(a.status, b.status)
  }
]

@Component({
  selector: 'gcd-schedule-pipeline-table',
  imports: [
    CommonModule,
    NzTableModule,
    NzToolTipModule,
    NzButtonModule,
    NzIconModule,
    NzBadgeModule,
    StatusColorPipe,
    JobsComponent,
    RetryPipelineIconComponent,
    CancelPipelineIconComponent,
    StartPipelineIconComponent
  ],
  templateUrl: './schedule-pipeline-table.component.html',
  styleUrls: ['./schedule-pipeline-table.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SchedulePipelineTableComponent {
  private i18n = inject(NzI18nService)

  pipelines = input.required<Pipeline[]>()
  loading = input.required<boolean>()

  headers: Header<Pipeline>[] = headers

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

  onClick(e: Event, { web_url }: Pipeline): void {
    e.stopPropagation()
    window.open(web_url, '_blank')
  }

  trackById({ id }: Pipeline): PipelineId {
    return id
  }
}
