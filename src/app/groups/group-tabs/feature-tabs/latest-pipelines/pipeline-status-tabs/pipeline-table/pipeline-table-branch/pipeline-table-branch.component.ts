import { AutoRefreshComponent } from '$groups/group-tabs/feature-tabs/components/auto-refresh/auto-refresh.component'
import { BranchWithLatestPipeline } from '$model/pipeline'
import { Pipeline } from '$model/pipeline'
import { ProjectId } from '$model/project'
import { StatusColorPipe } from '$pipes/status-color.pipe'
import { UIStore } from '$store/ui.store'
import { compareString, compareStringDate } from '$util/compare'
import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, Input } from '@angular/core'
import { Actions } from '@ngneat/effects-ng'
import { NzBadgeModule } from 'ng-zorro-antd/badge'
import { NzButtonModule } from 'ng-zorro-antd/button'
import { NzI18nService } from 'ng-zorro-antd/i18n'
import { NzIconModule } from 'ng-zorro-antd/icon'
import { NzTableModule } from 'ng-zorro-antd/table'
import { NzToolTipModule } from 'ng-zorro-antd/tooltip'
import { filter, firstValueFrom, switchMap } from 'rxjs'
import { fetchBranchesWithLatestPipeline } from '../../../store/latest-pipeline.actions'
import { LatestPipelineStore } from '../../../store/latest-pipeline.store'
import { BranchFilterComponent } from './branch-filter/branch-filter.component'

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
    BranchFilterComponent,
    AutoRefreshComponent,
    NzTableModule,
    NzToolTipModule,
    NzButtonModule,
    NzIconModule,
    NzBadgeModule,
    StatusColorPipe
  ],
  templateUrl: './pipeline-table-branch.component.html',
  styleUrls: ['./pipeline-table-branch.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PipelineTableBranchComponent {
  @Input({ required: true }) branches!: BranchWithLatestPipeline[]

  headers: Header<BranchWithLatestPipeline>[] = [
    { title: 'Branch', sortable: true, compare: (a, b) => compareString(a.branch.name, b.branch.name) },
    {
      title: 'Status',
      sortable: true,
      compare: (a, b) => compareString(a.latest_pipeline?.status, b.latest_pipeline?.status)
    },
    {
      title: 'Trigger',
      sortable: true,
      compare: (a, b) => compareString(a.latest_pipeline?.source, b.latest_pipeline?.source)
    },
    {
      title: 'Last Run',
      sortable: true,
      compare: (a, b) => compareStringDate(a.latest_pipeline?.updated_at, b.latest_pipeline?.updated_at)
    }
  ]

  loading$ = this.latestPipelineStore.branchesLoading$
  selectedProjectId$ = this.latestPipelineStore.selectedProjectId$.pipe(filter((id): id is ProjectId => id != null))
  autoRefreshLoading$ = this.selectedProjectId$.pipe(
    switchMap((projectId) => this.uiStore.autoRefreshLoading(projectId))
  )

  constructor(
    private i18n: NzI18nService,
    private latestPipelineStore: LatestPipelineStore,
    private uiStore: UIStore,
    private actions: Actions
  ) {}

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

  trackByBranchName(_: number, { branch: { name } }: BranchWithLatestPipeline): string {
    return name
  }

  async fetch(): Promise<void> {
    const projectId = await firstValueFrom(this.selectedProjectId$)
    this.actions.dispatch(fetchBranchesWithLatestPipeline({ projectId, withLoader: false }))
  }
}
