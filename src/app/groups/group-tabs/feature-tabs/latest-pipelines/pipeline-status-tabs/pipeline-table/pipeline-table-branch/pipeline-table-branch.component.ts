import { AutoRefreshComponent } from '$groups/group-tabs/feature-tabs/components/auto-refresh/auto-refresh.component'
import { JobsComponent } from '$groups/group-tabs/feature-tabs/components/jobs/jobs.component'
import { StatusColorPipe } from '$groups/group-tabs/feature-tabs/pipes/status-color.pipe'
import { BranchLatestPipeline, Pipeline } from '$groups/model/pipeline'
import { ProjectId } from '$groups/model/project'
import { Status } from '$groups/model/status'
import { compareString, compareStringDate } from '$groups/util/compare'
import { statusToScope } from '$groups/util/status-scope'
import { UIStore } from '$store/ui.store'
import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core'
import { NzBadgeModule } from 'ng-zorro-antd/badge'
import { NzButtonModule } from 'ng-zorro-antd/button'
import { NzI18nService } from 'ng-zorro-antd/i18n'
import { NzIconModule } from 'ng-zorro-antd/icon'
import { NzTableModule } from 'ng-zorro-antd/table'
import { NzToolTipModule } from 'ng-zorro-antd/tooltip'
import { LatestPipelineStore } from '../../../store/latest-pipeline.store'
import { LatestBranchFilterComponent } from './latest-branch-filter/latest-branch-filter.component'

interface Header<T> {
  title: string
  sortable: boolean
  compare: ((a: T, b: T) => number) | null
}

@Component({
  selector: 'gcd-pipeline-table-branch',
  standalone: true,
  imports: [
    CommonModule,
    LatestBranchFilterComponent,
    AutoRefreshComponent,
    JobsComponent,
    StatusColorPipe,
    NzTableModule,
    NzToolTipModule,
    NzButtonModule,
    NzIconModule,
    NzBadgeModule
  ],
  templateUrl: './pipeline-table-branch.component.html',
  styleUrls: ['./pipeline-table-branch.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PipelineTableBranchComponent {
  private i18n = inject(NzI18nService)
  private latestPipelineStore = inject(LatestPipelineStore)
  private uiStore = inject(UIStore)

  branches = input.required<BranchLatestPipeline[]>()

  headers: Header<BranchLatestPipeline>[] = [
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

  selectedProjectId = this.latestPipelineStore.selectedProjectId
  branchesLoading = this.latestPipelineStore.branchesLoading

  autoRefreshLoading = computed(() => {
    const projectId = this.selectedProjectId()
    return projectId ? this.uiStore.getAutoRefreshLoading(projectId)() : false
  })

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

  onActionClick(e: Event, { web_url }: Pipeline): void {
    e.stopPropagation()
    window.open(web_url, '_blank')
  }

  trackByBranchName(_: number, { branch: { name } }: BranchLatestPipeline): string {
    return name
  }

  fetch(projectId: ProjectId): void {
    this.latestPipelineStore.fetchBranches(projectId, false)
  }
}
