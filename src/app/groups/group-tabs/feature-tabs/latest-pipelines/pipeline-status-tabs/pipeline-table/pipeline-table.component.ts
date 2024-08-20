import { FavoritesIconComponent } from '$groups/group-tabs/favorites/favorites-icon/favorites-icon.component'
import { CancelPipelineIconComponent } from '$groups/group-tabs/feature-tabs/components/cancel-pipeline-icon/cancel-pipeline-icon.component'
import { JobsComponent } from '$groups/group-tabs/feature-tabs/components/jobs/jobs.component'
import { RetryPipelineIconComponent } from '$groups/group-tabs/feature-tabs/components/retry-pipeline-icon/retry-pipeline-icon.component'
import { StartPipelineIconComponent } from '$groups/group-tabs/feature-tabs/components/start-pipeline-icon/start-pipeline-icon.component'
import { FETCH_REFRESH_INTERVAL } from '$groups/http'
import { BranchPipeline } from '$groups/model/branch'
import { Pipeline } from '$groups/model/pipeline'
import { Project, ProjectId, ProjectPipeline } from '$groups/model/project'
import { Status } from '$groups/model/status'
import { compareString, compareStringDate } from '$groups/util/compare'
import { statusToScope } from '$groups/util/status-scope'
import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, DestroyRef, inject, input, signal } from '@angular/core'
import { takeUntilDestroyed } from '@angular/core/rxjs-interop'
import { NzButtonModule } from 'ng-zorro-antd/button'
import { NzI18nService } from 'ng-zorro-antd/i18n'
import { NzIconModule } from 'ng-zorro-antd/icon'
import { NzSpinModule } from 'ng-zorro-antd/spin'
import { NzTableModule } from 'ng-zorro-antd/table'
import { NzToolTipModule } from 'ng-zorro-antd/tooltip'
import { Subscription, interval, switchMap } from 'rxjs'
import { LatestPipelineService } from '../../service/latest-pipeline.service'
import { PipelineTableBranchComponent } from './pipeline-table-branch/pipeline-table-branch.component'

interface Header<T> {
  title: string
  sortable: boolean
  compare: ((a: T, b: T) => number) | null
}

const headers: Header<ProjectPipeline>[] = [
  { title: 'Project', sortable: true, compare: (a, b) => compareString(a.project.name, b.project.name) },
  {
    title: 'Branch',
    sortable: true,
    compare: (a, b) => compareString(a.project.default_branch, b.project.default_branch)
  },
  {
    title: 'Topics',
    sortable: true,
    compare: (a, b) => compareString(a.project.topics.join(','), b.project.topics.join(','))
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
  selector: 'gcd-pipeline-table',
  standalone: true,
  imports: [
    CommonModule,
    NzTableModule,
    NzToolTipModule,
    NzButtonModule,
    NzIconModule,
    NzSpinModule,
    PipelineTableBranchComponent,
    JobsComponent,
    FavoritesIconComponent,
    RetryPipelineIconComponent,
    CancelPipelineIconComponent,
    StartPipelineIconComponent
  ],
  templateUrl: './pipeline-table.component.html',
  styleUrls: ['./pipeline-table.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PipelineTableComponent {
  private i18n = inject(NzI18nService)
  private latestPipelineService = inject(LatestPipelineService)
  private destroyRef = inject(DestroyRef)

  private refreshSubscription?: Subscription

  projects = input.required<ProjectPipeline[]>()
  status = input<Status>()

  selectedProjectId = signal<number | undefined>(undefined)

  headers: Header<ProjectPipeline>[] = headers
  branchPipelines = signal<BranchPipeline[]>([])
  branchesLoading = signal(false)

  get locale(): string {
    const { locale } = this.i18n.getLocale()
    return locale
  }

  get scope(): Status[] {
    return statusToScope(this.status())
  }

  get timeZone(): string {
    const { timeZone } = Intl.DateTimeFormat().resolvedOptions()
    return timeZone
  }

  onActionClick(e: Event, { web_url }: Pipeline): void {
    e.stopPropagation()
    window.open(web_url, '_blank')
  }

  onRowClick({ id: projectId }: Project) {
    this.refreshSubscription?.unsubscribe()

    const selectedId = this.selectedProjectId()
    if (projectId === selectedId) {
      this.selectedProjectId.set(undefined)
    } else {
      this.selectedProjectId.set(projectId)

      this.branchesLoading.set(true)
      this.latestPipelineService.getBranchesWithLatestPipeline(projectId).subscribe((branchPipelines) => {
        this.branchesLoading.set(false)
        this.branchPipelines.set(branchPipelines)
      })

      this.refreshSubscription = interval(FETCH_REFRESH_INTERVAL)
        .pipe(
          takeUntilDestroyed(this.destroyRef),
          switchMap(() => this.latestPipelineService.getBranchesWithLatestPipeline(projectId))
        )
        .subscribe((branchPipelines) => this.branchPipelines.set(branchPipelines))
    }
  }

  trackByProjectId(_: number, { project: { id } }: ProjectPipeline): ProjectId {
    return id
  }
}
