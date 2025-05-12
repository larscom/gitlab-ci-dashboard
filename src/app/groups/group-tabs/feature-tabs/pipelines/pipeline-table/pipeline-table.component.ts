import { FavoritesIconComponent } from '$groups/group-tabs/favorites/favorites-icon/favorites-icon.component'
import { Pipeline, PipelineId } from '$groups/model/pipeline'
import { ProjectPipeline } from '$groups/model/project'
import { Status } from '$groups/model/status'
import { compareString, compareStringDate } from '$groups/util/compare'
import { statusToScope } from '$groups/util/status-scope'
import { Header } from '$groups/util/table'
import { ConfigService } from '$service/config.service'
import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, computed, inject, input, model, Signal } from '@angular/core'
import { NzBadgeModule } from 'ng-zorro-antd/badge'
import { NzButtonModule } from 'ng-zorro-antd/button'
import { NzI18nService } from 'ng-zorro-antd/i18n'
import { NzIconModule } from 'ng-zorro-antd/icon'
import { NzSpinModule } from 'ng-zorro-antd/spin'
import { NzTableModule } from 'ng-zorro-antd/table'
import { NzTagModule } from 'ng-zorro-antd/tag'
import { NzToolTipModule } from 'ng-zorro-antd/tooltip'
import { DownloadArtifactsIconComponent } from '../../components/download-artifacts-icon/download-artifacts-icon.component'
import { JobsComponent } from '../../components/jobs/jobs.component'
import { OpenGitlabIconComponent } from '../../components/open-gitlab-icon/open-gitlab-icon.component'
import { WriteActionsIconComponent } from '../../components/write-actions-icon/write-actions-icon.component'
import { StatusColorPipe } from '../../pipes/status-color.pipe'

const headers: Header<ProjectPipeline>[] = [
  { title: 'Project', sortable: true, compare: (a, b) => compareString(a.project.name, b.project.name) },
   {
    title: 'Group',
    sortable: true,
    compare: (a, b) => compareString(a.project.namespace.name, b.project.namespace.name)
  },
  {
    title: 'Branch',
    sortable: true,
    compare: (a, b) => compareString(a.project.default_branch, b.project.default_branch)
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

const semverRegex =
  /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9A-Za-z-][0-9A-Za-z-]*)(?:\.(?:0|[1-9A-Za-z-][0-9A-Za-z-]*))*))?(?:\+([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?$/

@Component({
  selector: 'gcd-pipeline-table',
  imports: [
    CommonModule,
    NzTableModule,
    NzToolTipModule,
    NzButtonModule,
    NzBadgeModule,
    NzIconModule,
    NzSpinModule,
    NzTagModule,
    StatusColorPipe,
    JobsComponent,
    FavoritesIconComponent,
    DownloadArtifactsIconComponent,
    WriteActionsIconComponent,
    OpenGitlabIconComponent
  ],
  templateUrl: './pipeline-table.component.html',
  styleUrls: ['./pipeline-table.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PipelineTableComponent {
  private i18n = inject(NzI18nService)
  private config = inject(ConfigService)

  projectPipelines = input.required<ProjectPipeline[]>()
  pinnedPipelines = model.required<PipelineId[]>()

  headers: Header<ProjectPipeline>[] = headers

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

  isPinned(id?: PipelineId): boolean {
    return id ? this.pinnedPipelines().includes(id) : false
  }

  isTag(ref: string): boolean {
    return semverRegex.test(ref)
  }

  getScope(status?: Status): Status[] {
    return statusToScope(status)
  }

  onPinClick(e: Event, { id }: Pipeline): void {
    e.stopPropagation()

    const selected = this.pinnedPipelines()
    if (selected.includes(id)) {
      this.pinnedPipelines.set(selected.filter((i) => i !== id))
    } else {
      this.pinnedPipelines.set([...selected, id])
    }
  }

  trackBy(index: number, { pipeline }: ProjectPipeline): PipelineId | number {
    return pipeline?.id || index
  }
}
