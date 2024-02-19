import { Pipeline, PipelineId, ProjectWithPipeline } from '$groups/model/pipeline'
import { Status } from '$groups/model/status'
import { compareString, compareStringDate } from '$groups/util/compare'
import { statusToScope } from '$groups/util/status-scope'
import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, EventEmitter, Output, inject, input } from '@angular/core'
import { NzBadgeModule } from 'ng-zorro-antd/badge'
import { NzButtonModule } from 'ng-zorro-antd/button'
import { NzI18nService } from 'ng-zorro-antd/i18n'
import { NzIconModule } from 'ng-zorro-antd/icon'
import { NzSpinModule } from 'ng-zorro-antd/spin'
import { NzTableModule } from 'ng-zorro-antd/table'
import { NzToolTipModule } from 'ng-zorro-antd/tooltip'
import { JobsComponent } from '../../components/jobs/jobs.component'
import { StatusColorPipe } from '../../pipes/status-color.pipe'

interface Header<T> {
  title: string
  sortable: boolean
  compare: ((a: T, b: T) => number) | null
}

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
    JobsComponent
  ],
  templateUrl: './pipeline-table.component.html',
  styleUrls: ['./pipeline-table.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PipelineTableComponent {
  projects = input.required<ProjectWithPipeline[]>()
  pinnedPipelines = input.required<PipelineId[]>()

  i18n = inject(NzI18nService)

  @Output() pinnedPipelinesChanged = new EventEmitter<PipelineId[]>()

  headers: Header<ProjectWithPipeline>[] = [
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
      this.pinnedPipelinesChanged.next(selected.filter((i) => i !== id))
    } else {
      setTimeout(() => this.pinnedPipelinesChanged.next([...selected, id]), 125)
    }
  }

  trackBy(index: number, { pipeline }: ProjectWithPipeline): PipelineId | number {
    return pipeline?.id || index
  }
}
