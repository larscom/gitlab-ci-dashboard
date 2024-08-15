import { FavoritesIconComponent } from '$groups/group-tabs/favorites/favorites-icon/favorites-icon.component'
import { Pipeline, PipelineId } from '$groups/model/pipeline'
import { ProjectPipeline } from '$groups/model/project'
import { Status } from '$groups/model/status'
import { compareString, compareStringDate } from '$groups/util/compare'
import { statusToScope } from '$groups/util/status-scope'
import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, inject, input, model } from '@angular/core'
import { NzBadgeModule } from 'ng-zorro-antd/badge'
import { NzButtonModule } from 'ng-zorro-antd/button'
import { NzI18nService } from 'ng-zorro-antd/i18n'
import { NzIconModule } from 'ng-zorro-antd/icon'
import { NzSpinModule } from 'ng-zorro-antd/spin'
import { NzTableModule } from 'ng-zorro-antd/table'
import { NzToolTipModule } from 'ng-zorro-antd/tooltip'
import { StartPipelineIconComponent } from '../../components/start-pipeline-icon/start-pipeline-icon.component'
import { JobsComponent } from '../../components/jobs/jobs.component'
import { RetryPipelineIconComponent } from '../../components/retry-pipeline-icon/retry-pipeline-icon.component'
import { StatusColorPipe } from '../../pipes/status-color.pipe'

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
  selector: 'gcd-pipeline-table',
  standalone: true,
  imports: [
    CommonModule,
    NzTableModule,
    NzToolTipModule,
    NzButtonModule,
    NzBadgeModule,
    NzIconModule,
    NzSpinModule,
    StatusColorPipe,
    JobsComponent,
    RetryPipelineIconComponent,
    StartPipelineIconComponent,
    FavoritesIconComponent
  ],
  templateUrl: './pipeline-table.component.html',
  styleUrls: ['./pipeline-table.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PipelineTableComponent {
  private i18n = inject(NzI18nService)

  projectPipelines = input.required<ProjectPipeline[]>()
  pinnedPipelines = model.required<PipelineId[]>()

  headers: Header<ProjectPipeline>[] = headers

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
