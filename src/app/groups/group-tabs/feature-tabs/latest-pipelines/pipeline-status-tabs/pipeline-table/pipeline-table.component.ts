import { FavoritesIconComponent } from '$groups/group-tabs/favorites/favorites-icon/favorites-icon.component'
import { DownloadArtifactsIconComponent } from '$groups/group-tabs/feature-tabs/components/download-artifacts-icon/download-artifacts-icon.component'
import { JobsComponent } from '$groups/group-tabs/feature-tabs/components/jobs/jobs.component'
import { WriteActionsIconComponent } from '$groups/group-tabs/feature-tabs/components/write-actions-icon/write-actions-icon.component'
import { FETCH_REFRESH_INTERVAL } from '$groups/http'
import { BranchPipeline } from '$groups/model/branch'
import { Project, ProjectId, ProjectPipeline } from '$groups/model/project'
import { Status } from '$groups/model/status'
import { compareString, compareStringDate } from '$groups/util/compare'
import { statusToScope } from '$groups/util/status-scope'
import { Header } from '$groups/util/table'
import { ConfigService } from '$service/config.service'
import { CommonModule } from '@angular/common'
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  input,
  OnDestroy,
  Signal,
  signal
} from '@angular/core'
import { takeUntilDestroyed } from '@angular/core/rxjs-interop'
import { NzButtonModule } from 'ng-zorro-antd/button'
import { NzI18nService } from 'ng-zorro-antd/i18n'
import { NzIconModule } from 'ng-zorro-antd/icon'
import { NzSpinModule } from 'ng-zorro-antd/spin'
import { NzTableModule } from 'ng-zorro-antd/table'
import { NzToolTipModule } from 'ng-zorro-antd/tooltip'
import { finalize, interval, Subscription, switchMap } from 'rxjs'
import { OpenGitlabIconComponent } from '../../../components/open-gitlab-icon/open-gitlab-icon.component'
import { LatestPipelineService } from '../../service/latest-pipeline.service'
import { PipelineTableBranchComponent } from './pipeline-table-branch/pipeline-table-branch.component'

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
    WriteActionsIconComponent,
    DownloadArtifactsIconComponent,
    OpenGitlabIconComponent
  ],
  templateUrl: './pipeline-table.component.html',
  styleUrls: ['./pipeline-table.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PipelineTableComponent implements OnDestroy {
  private i18n = inject(NzI18nService)
  private latestPipelineService = inject(LatestPipelineService)
  private destroyRef = inject(DestroyRef)
  private config = inject(ConfigService)

  private refreshSubscription?: Subscription

  projects = input.required<ProjectPipeline[]>()
  status = input<Status>()

  selectedProjectId = signal<number | undefined>(undefined)

  headers: Header<ProjectPipeline>[] = headers
  branchPipelines = signal<BranchPipeline[]>([])
  branchesLoading = signal(false)

  ngOnDestroy(): void {
    this.refreshSubscription?.unsubscribe()
  }

  get showWriteActions(): Signal<boolean> {
    return computed(() => !this.config.hideWriteActions())
  }

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

  onRowClick({ id: projectId }: Project) {
    this.refreshSubscription?.unsubscribe()

    const selectedId = this.selectedProjectId()
    if (projectId === selectedId) {
      this.selectedProjectId.set(undefined)
    } else {
      this.selectedProjectId.set(projectId)

      this.branchesLoading.set(true)
      this.latestPipelineService
        .getBranchesWithLatestPipeline(projectId)
        .pipe(finalize(() => this.branchesLoading.set(false)))
        .subscribe((branchPipelines) => this.branchPipelines.set(branchPipelines))

      this.refreshSubscription = interval(FETCH_REFRESH_INTERVAL)
        .pipe(
          takeUntilDestroyed(this.destroyRef),
          switchMap(() => this.latestPipelineService.getBranchesWithLatestPipeline(projectId))
        )
        .subscribe((branchPipelines) => this.branchPipelines.set(branchPipelines))
    }
  }

  trackByProjectId({ project: { id } }: ProjectPipeline): ProjectId {
    return id
  }
}
