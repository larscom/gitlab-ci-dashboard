import { DownloadArtifactsIconComponent } from '$groups/group-tabs/feature-tabs/components/download-artifacts-icon/download-artifacts-icon.component'
import { JobsComponent } from '$groups/group-tabs/feature-tabs/components/jobs/jobs.component'
import { OpenGitlabIconComponent } from '$groups/group-tabs/feature-tabs/components/open-gitlab-icon/open-gitlab-icon.component'
import { WriteActionsIconComponent } from '$groups/group-tabs/feature-tabs/components/write-actions-icon/write-actions-icon.component'
import { StatusColorPipe } from '$groups/group-tabs/feature-tabs/pipes/status-color.pipe'
import { Pipeline, PipelineId } from '$groups/model/pipeline'
import { Status } from '$groups/model/status'
import { compareString, compareStringDate } from '$groups/util/compare'
import { statusToScope } from '$groups/util/status-scope'
import { Header } from '$groups/util/table'
import { ConfigService } from '$service/config.service'
import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, computed, inject, input, Signal } from '@angular/core'
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
    WriteActionsIconComponent,
    DownloadArtifactsIconComponent,
    OpenGitlabIconComponent
  ],
  templateUrl: './schedule-pipeline-table.component.html',
  styleUrls: ['./schedule-pipeline-table.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SchedulePipelineTableComponent {
  private i18n = inject(NzI18nService)
  private config = inject(ConfigService)

  pipelines = input.required<Pipeline[]>()
  loading = input.required<boolean>()

  headers: Header<Pipeline>[] = headers

  get showWriteActions(): Signal<boolean> {
    return computed(() => !this.config.hideWriteActions())
  }

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

  trackById({ id }: Pipeline): PipelineId {
    return id
  }
}
