import { CancelPipelineIconComponent } from '$groups/group-tabs/feature-tabs/components/cancel-pipeline-icon/cancel-pipeline-icon.component'
import { JobsComponent } from '$groups/group-tabs/feature-tabs/components/jobs/jobs.component'
import { RetryPipelineIconComponent } from '$groups/group-tabs/feature-tabs/components/retry-pipeline-icon/retry-pipeline-icon.component'
import { StartPipelineIconComponent } from '$groups/group-tabs/feature-tabs/components/start-pipeline-icon/start-pipeline-icon.component'
import { StatusColorPipe } from '$groups/group-tabs/feature-tabs/pipes/status-color.pipe'
import { BranchPipeline } from '$groups/model/branch'
import { Pipeline } from '$groups/model/pipeline'
import { Status } from '$groups/model/status'
import { compareString, compareStringDate } from '$groups/util/compare'
import { filterString } from '$groups/util/filter'
import { statusToScope } from '$groups/util/status-scope'
import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core'
import { NzBadgeModule } from 'ng-zorro-antd/badge'
import { NzButtonModule } from 'ng-zorro-antd/button'
import { NzI18nService } from 'ng-zorro-antd/i18n'
import { NzIconModule } from 'ng-zorro-antd/icon'
import { NzTableModule } from 'ng-zorro-antd/table'
import { NzToolTipModule } from 'ng-zorro-antd/tooltip'
import { LatestBranchFilterComponent } from './latest-branch-filter/latest-branch-filter.component'
import { Header } from '$groups/util/table'

const headers: Header<BranchPipeline>[] = [
  { title: 'Branch', sortable: true, compare: (a, b) => compareString(a.branch.name, b.branch.name) },
  {
    title: 'Status',
    sortable: true,
    compare: (a, b) => compareString(a.pipeline?.status, b.pipeline?.status)
  },
  {
    title: 'Trigger',
    sortable: true,
    compare: (a, b) => compareString(a.pipeline?.source, b.pipeline?.source)
  },
  {
    title: 'Last Run',
    sortable: true,
    compare: (a, b) => compareStringDate(a.pipeline?.updated_at, b.pipeline?.updated_at)
  }
]

@Component({
  selector: 'gcd-pipeline-table-branch',
  imports: [
    CommonModule,
    LatestBranchFilterComponent,
    JobsComponent,
    StatusColorPipe,
    NzTableModule,
    NzToolTipModule,
    NzButtonModule,
    NzIconModule,
    NzBadgeModule,
    RetryPipelineIconComponent,
    CancelPipelineIconComponent,
    StartPipelineIconComponent
  ],
  templateUrl: './pipeline-table-branch.component.html',
  styleUrls: ['./pipeline-table-branch.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PipelineTableBranchComponent {
  private i18n = inject(NzI18nService)

  branchPipelines = input.required<BranchPipeline[]>()
  loading = input.required<boolean>()

  filterText = signal('')

  filteredBranches = computed(() =>
    this.branchPipelines().filter(({ branch: { name } }) => filterString(name, this.filterText()))
  )
  branchCount = computed(() => this.branchPipelines().length)

  headers: Header<BranchPipeline>[] = headers

  get locale(): string {
    const { locale } = this.i18n.getLocale()
    return locale
  }

  get timeZone(): string {
    const { timeZone } = Intl.DateTimeFormat().resolvedOptions()
    return timeZone
  }

  onFilterTextChanged(filterText: string) {
    this.filterText.set(filterText)
  }

  getScope(status?: Status): Status[] {
    return statusToScope(status)
  }

  onActionClick(e: Event, { web_url }: Pipeline): void {
    e.stopPropagation()
    window.open(web_url, '_blank')
  }

  trackByBranchName({ branch: { name } }: BranchPipeline): string {
    return name
  }
}
