import { FavoritesIconComponent } from '$groups/group-tabs/favorites/favorites-icon/favorites-icon.component'
import { PipelineId } from '$groups/model/pipeline'
import { ProjectPipeline } from '$groups/model/project'
import { Status } from '$groups/model/status'
import { compareString, compareStringDate } from '$groups/util/compare'
import { statusToScope } from '$groups/util/status-scope'
import { projectNamespacePath } from '$groups/util/project-path'
import { Header } from '$groups/util/table'
import { CommonModule } from '@angular/common'
import { FormsModule } from '@angular/forms'
import { ChangeDetectionStrategy, Component, inject, input, output, signal } from '@angular/core'
import { NzButtonModule } from 'ng-zorro-antd/button'
import { NzI18nService } from 'ng-zorro-antd/i18n'
import { NzIconModule } from 'ng-zorro-antd/icon'
import { NzResizableModule, NzResizeEvent } from 'ng-zorro-antd/resizable'
import { NzSelectModule } from 'ng-zorro-antd/select'
import { NzSpinModule } from 'ng-zorro-antd/spin'
import { NzTableComponent, NzTableModule } from 'ng-zorro-antd/table'
import { NzTagModule } from 'ng-zorro-antd/tag'
import { NzTooltipModule } from 'ng-zorro-antd/tooltip'
import { DownloadArtifactsIconComponent } from '../../components/download-artifacts-icon/download-artifacts-icon.component'
import { JobsComponent } from '../../components/jobs/jobs.component'
import { OpenGitlabIconComponent } from '../../components/open-gitlab-icon/open-gitlab-icon.component'
import { StatusColorPipe } from '../../pipes/status-color.pipe'
import { TablePaginatorDirective } from '../../directives/table-paginator.directive'
import { TableActionsComponent } from '../../components/table-actions/table-actions.component'

interface ResizableHeader<T> extends Header<T> {
  width: number
}

const headers: ResizableHeader<ProjectPipeline>[] = [
  {
    title: 'Group',
    width: 320,
    sortable: true,
    compare: (a, b) => compareString(projectNamespacePath(a.project), projectNamespacePath(b.project))
  },
  { title: 'Project', width: 220, sortable: true, compare: (a, b) => compareString(a.project.name, b.project.name) },
  {
    title: 'Branch',
    width: 300,
    sortable: true,
    compare: (a, b) => compareString(a.project.default_branch, b.project.default_branch)
  },
  {
    title: 'Trigger',
    width: 190,
    sortable: true,
    compare: (a, b) => compareString(a.pipeline?.source, b.pipeline?.source)
  },
  {
    title: 'Last Run',
    width: 210,
    sortable: true,
    compare: (a, b) => compareStringDate(a.pipeline?.updated_at, b.pipeline?.updated_at)
  },
  {
    title: 'Status',
    width: 130,
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
    FormsModule,
    NzTableModule,
    NzTooltipModule,
    NzButtonModule,
    NzIconModule,
    NzResizableModule,
    NzSelectModule,
    NzSpinModule,
    NzTagModule,
    StatusColorPipe,
    JobsComponent,
    FavoritesIconComponent,
    DownloadArtifactsIconComponent,
    OpenGitlabIconComponent,
    TableActionsComponent,
    TablePaginatorDirective
  ],
  templateUrl: './pipeline-table.component.html',
  styleUrls: ['./pipeline-table.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PipelineTableComponent {
  private i18n = inject(NzI18nService)

  projectPipelines = input.required<ProjectPipeline[]>()
  pipelineStatusChange = output<{ pipelineId: PipelineId; status?: Status }>()

  headers: ResizableHeader<ProjectPipeline>[] = headers
  projectNamespacePath = projectNamespacePath
  jobsWidth = 900
  actionWidth = 72
  pageIndex = signal(1)
  readonly pageSizeOptions = [10, 20, 30, 40, 50, 100]
  readonly allPageSize = 1_000_000_000

  get widthConfig(): string[] {
    return [...this.headers.map(({ width }) => `${width}px`), `${this.jobsWidth}px`, `${this.actionWidth}px`]
  }

  get tableWidth(): number {
    return this.headers.reduce((total, { width }) => total + width, this.jobsWidth + this.actionWidth)
  }

  get locale(): string {
    const { locale } = this.i18n.getLocale()
    return locale
  }

  get timeZone(): string {
    const { timeZone } = Intl.DateTimeFormat().resolvedOptions()
    return timeZone
  }

  pageCount(total:number,pageSize:number){return Math.max(1,Math.ceil(total/pageSize))}

  rangeStart(total: number, pageSize: number): number {
    return total ? (this.pageIndex() - 1) * pageSize + 1 : 0
  }

  rangeEnd(total: number, pageSize: number): number {
    return Math.min(this.pageIndex() * pageSize, total)
  }

  changePageSize(table: NzTableComponent<ProjectPipeline>, pageSize: number): void {
    table.onPageSizeChange(pageSize)
    this.pageIndex.set(1)
  }

  isTag(ref: string): boolean {
    return semverRegex.test(ref)
  }

  getScope(status?: Status): Status[] {
    return statusToScope(status)
  }

  onDownstreamStatusChange(pipelineId: PipelineId, status?: Status): void {
    this.pipelineStatusChange.emit({ pipelineId, status })
  }

  onHeaderResize({ width }: NzResizeEvent, header: ResizableHeader<ProjectPipeline>): void {
    if (width) {
      header.width = width
    }
  }

  onJobsResize({ width }: NzResizeEvent): void {
    if (width) {
      this.jobsWidth = width
    }
  }

  onActionResize({ width }: NzResizeEvent): void {
    if (width) {
      this.actionWidth = width
    }
  }

  trackBy(index: number, { pipeline }: ProjectPipeline): PipelineId | number {
    return pipeline?.id || index
  }
}
