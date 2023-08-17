import { AutoRefreshComponent } from '$groups/group-tabs/feature-tabs/components/auto-refresh/auto-refresh.component'
import { StatusColorPipe } from '$groups/group-tabs/feature-tabs/pipes/status-color.pipe'
import { BranchWithPipeline, Pipeline } from '$groups/model/pipeline'
import { compareString, compareStringDate } from '$groups/util/compare'
import { filterNotNull } from '$groups/util/filter'
import { UIStore } from '$store/ui.store'
import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, Input } from '@angular/core'
import { Actions } from '@ngneat/effects-ng'
import { NzBadgeModule } from 'ng-zorro-antd/badge'
import { NzButtonModule } from 'ng-zorro-antd/button'
import { NzI18nService } from 'ng-zorro-antd/i18n'
import { NzIconModule } from 'ng-zorro-antd/icon'
import { NzTableModule } from 'ng-zorro-antd/table'
import { NzToolTipModule } from 'ng-zorro-antd/tooltip'
import { firstValueFrom, switchMap } from 'rxjs'
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
  @Input({ required: true }) branches!: BranchWithPipeline[]

  headers: Header<BranchWithPipeline>[] = [
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

  loading$ = this.latestPipelineStore.branchesLoading$
  selectedProjectId$ = this.latestPipelineStore.selectedProjectId$.pipe(filterNotNull)
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

  trackByBranchName(_: number, { branch: { name } }: BranchWithPipeline): string {
    return name
  }

  async fetch(): Promise<void> {
    const projectId = await firstValueFrom(this.selectedProjectId$)
    this.actions.dispatch(fetchBranchesWithLatestPipeline({ projectId, withLoader: false }))
  }
}
