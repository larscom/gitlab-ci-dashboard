import { DownloadArtifactsIconComponent } from '$groups/group-tabs/feature-tabs/components/download-artifacts-icon/download-artifacts-icon.component'
import { JobFilterComponent } from '$groups/group-tabs/feature-tabs/components/job-filter/job-filter.component'
import { JobsComponent } from '$groups/group-tabs/feature-tabs/components/jobs/jobs.component'
import { OpenGitlabIconComponent } from '$groups/group-tabs/feature-tabs/components/open-gitlab-icon/open-gitlab-icon.component'
import { WriteActionsIconComponent } from '$groups/group-tabs/feature-tabs/components/write-actions-icon/write-actions-icon.component'
import { CoverageColorPipe } from '$groups/group-tabs/feature-tabs/pipes/coverage-color.pipe'
import { StatusColorPipe } from '$groups/group-tabs/feature-tabs/pipes/status-color.pipe'
import { BranchPipeline } from '$groups/model/branch'
import { Status } from '$groups/model/status'
import { compareNumber, compareString, compareStringDate } from '$groups/util/compare'
import { filterFailedJobs, filterString } from '$groups/util/filter'
import { statusToScope } from '$groups/util/status-scope'
import { Header } from '$groups/util/table'
import { ConfigService } from '$service/config.service'
import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, computed, inject, input, Signal, signal } from '@angular/core'
import { NzBadgeModule } from 'ng-zorro-antd/badge'
import { NzButtonModule } from 'ng-zorro-antd/button'
import { NzI18nService } from 'ng-zorro-antd/i18n'
import { NzIconModule } from 'ng-zorro-antd/icon'
import { NzTableModule } from 'ng-zorro-antd/table'
import { NzTooltipModule } from 'ng-zorro-antd/tooltip'
import { LatestBranchFilterComponent } from './latest-branch-filter/latest-branch-filter.component'
import { TablePaginatorDirective } from '$groups/group-tabs/feature-tabs/directives/table-paginator.directive'

const headers: Header<BranchPipeline>[] = [
  { title: 'Branch', sortable: true, compare: (a, b) => compareString(a.branch.name, b.branch.name) },
  {
    title: 'Coverage',
    sortable: true,
    compare: (a, b) => compareNumber(a.pipeline?.coverage, b.pipeline?.coverage)
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
  },
  {
    title: 'Status',
    sortable: true,
    compare: (a, b) => compareString(a.pipeline?.status, b.pipeline?.status)
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
    NzTooltipModule,
    NzButtonModule,
    NzIconModule,
    NzBadgeModule,
    WriteActionsIconComponent,
    OpenGitlabIconComponent,
    DownloadArtifactsIconComponent,
    JobFilterComponent,
    CoverageColorPipe,
    TablePaginatorDirective
  ],
  templateUrl: './pipeline-table-branch.component.html',
  styleUrls: ['./pipeline-table-branch.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PipelineTableBranchComponent {
  private i18n = inject(NzI18nService)
  private config = inject(ConfigService)

  branchPipelines = input.required<BranchPipeline[]>()
  loading = input.required<boolean>()

  filterText = signal('')
  filterJobs = signal<string[]>([])

  jobs = computed(() => this.branchPipelines().flatMap(({ failed_jobs: jobs }) => jobs ?? []))

  filteredBranches = computed(() =>
    this.branchPipelines()
      .filter(({ branch: { name } }) => filterString(name, this.filterText()))
      .filter(({ failed_jobs: jobs }) => filterFailedJobs(jobs ?? [], this.filterJobs()))
  )
  branchCount = computed(() => this.branchPipelines().length)

  headers: Header<BranchPipeline>[] = headers

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

  onFilterTextChanged(filterText: string) {
    this.filterText.set(filterText)
  }

  onFilterJobsChanged(jobs: string[]): void {
    this.filterJobs.set(jobs)
  }

  getScope(status?: Status): Status[] {
    return statusToScope(status)
  }

  trackByBranchCommitId({
    branch: {
      commit: { id }
    }
  }: BranchPipeline): string {
    return id
  }
}
