import { FavoritesIconComponent } from '$groups/group-tabs/favorites/favorites-icon/favorites-icon.component'
import { StatusColorPipe } from '$groups/group-tabs/feature-tabs/pipes/status-color.pipe'
import { FETCH_REFRESH_INTERVAL } from '$groups/http'
import { Pipeline, Source } from '$groups/model/pipeline'
import { Project } from '$groups/model/project'
import { ScheduleId, ScheduleProjectPipeline } from '$groups/model/schedule'
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
import { NzBadgeModule } from 'ng-zorro-antd/badge'
import { NzButtonModule } from 'ng-zorro-antd/button'
import { NzI18nService } from 'ng-zorro-antd/i18n'
import { NzIconModule } from 'ng-zorro-antd/icon'
import { NzTableModule } from 'ng-zorro-antd/table'
import { NzToolTipModule } from 'ng-zorro-antd/tooltip'
import { finalize, interval, map, Subscription, switchMap } from 'rxjs'
import { DownloadArtifactsIconComponent } from '../../components/download-artifacts-icon/download-artifacts-icon.component'
import { JobsComponent } from '../../components/jobs/jobs.component'
import { WriteActionsIconComponent } from '../../components/write-actions-icon/write-actions-icon.component'
import { PipelinesService } from '../../pipelines/service/pipelines.service'
import { NextRunAtPipe } from './pipes/next-run-at.pipe'
import { SchedulePipelineTableComponent } from './schedule-pipeline-table/schedule-pipeline-table.component'
import { OpenGitlabIconComponent } from '../../components/open-gitlab-icon/open-gitlab-icon.component'

const headers: Header<ScheduleProjectPipeline>[] = [
  { title: 'Project', sortable: true, compare: (a, b) => compareString(a.project.name, b.project.name) },
   {
    title: 'Group',
    sortable: true,
    compare: (a, b) => compareString(a.project.namespace.name, b.project.namespace.name)
  },
  {
    title: 'Description',
    sortable: true,
    compare: (a, b) => compareString(a.schedule.description, b.schedule.description)
  },
  { title: 'Branch', sortable: false, compare: null },
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
    title: 'Next Run',
    sortable: true,
    compare: (a, b) => compareStringDate(a.schedule.next_run_at, b.schedule.next_run_at)
  },
  {
    title: 'Status',
    sortable: true,
    compare: (a, b) => compareString(a.pipeline?.status, b.pipeline?.status)
  }
]

@Component({
  selector: 'gcd-schedule-table',
  imports: [
    CommonModule,
    NzTableModule,
    NzToolTipModule,
    NzButtonModule,
    NzIconModule,
    NzBadgeModule,
    NextRunAtPipe,
    StatusColorPipe,
    JobsComponent,
    FavoritesIconComponent,
    SchedulePipelineTableComponent,
    WriteActionsIconComponent,
    DownloadArtifactsIconComponent,
    OpenGitlabIconComponent
  ],
  templateUrl: './schedule-table.component.html',
  styleUrls: ['./schedule-table.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ScheduleTableComponent implements OnDestroy {
  private i18n = inject(NzI18nService)
  private pipelinesService = inject(PipelinesService)
  private destroyRef = inject(DestroyRef)
  private config = inject(ConfigService)

  private refreshSubscription?: Subscription

  schedulePipelines = input.required<ScheduleProjectPipeline[]>()

  selectedProjectId = signal<number | undefined>(undefined)
  pipelines = signal<Pipeline[]>([])
  loading = signal(false)

  headers: Header<ScheduleProjectPipeline>[] = headers

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

  get timeZone(): string {
    const { timeZone } = Intl.DateTimeFormat().resolvedOptions()
    return timeZone
  }

  getScope(status?: Status): Status[] {
    return statusToScope(status)
  }

  onScheduleClick(e: Event, { web_url }: Project): void {
    e.stopPropagation()
    window.open(`${web_url}/-/pipeline_schedules`, '_blank')
  }

  onRowClick({ id: projectId }: Project) {
    this.refreshSubscription?.unsubscribe()

    const selectedId = this.selectedProjectId()
    if (projectId === selectedId) {
      this.selectedProjectId.set(undefined)
    } else {
      this.selectedProjectId.set(projectId)
      this.loading.set(true)

      const schedule = this.schedulePipelines().find(({ project }) => project.id === projectId)
      const source$ = this.pipelinesService
        .getPipelines(projectId, Source.SCHEDULE)
        .pipe(map((pipelines) => pipelines.filter((pipeline) => pipeline.id !== schedule?.pipeline?.id)))

      source$.pipe(finalize(() => this.loading.set(false))).subscribe((pipelines) => this.pipelines.set(pipelines))

      this.refreshSubscription = interval(FETCH_REFRESH_INTERVAL)
        .pipe(
          takeUntilDestroyed(this.destroyRef),
          switchMap(() => source$)
        )
        .subscribe((pipelines) => this.pipelines.set(pipelines))
    }
  }

  trackByScheduleId({ schedule: { id } }: ScheduleProjectPipeline): ScheduleId {
    return id
  }
}
