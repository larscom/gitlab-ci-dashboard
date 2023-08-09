import { Pipeline, ProjectWithLatestPipeline } from '$groups/model/pipeline'
import { Project, ProjectId } from '$groups/model/project'
import { compareString, compareStringDate } from '$groups/util/compare'
import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, Input } from '@angular/core'
import { Actions } from '@ngneat/effects-ng'
import { NzButtonModule } from 'ng-zorro-antd/button'
import { NzI18nService } from 'ng-zorro-antd/i18n'
import { NzIconModule } from 'ng-zorro-antd/icon'
import { NzSpinModule } from 'ng-zorro-antd/spin'
import { NzTableModule } from 'ng-zorro-antd/table'
import { NzToolTipModule } from 'ng-zorro-antd/tooltip'
import { firstValueFrom } from 'rxjs'
import { fetchBranchesWithLatestPipeline } from '../../store/latest-pipeline.actions'
import { LatestPipelineStore } from '../../store/latest-pipeline.store'
import { BranchFilterService } from './pipeline-table-branch/branch-filter/branch-filter.service'
import { PipelineTableBranchComponent } from './pipeline-table-branch/pipeline-table-branch.component'

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
    NzIconModule,
    PipelineTableBranchComponent,
    NzSpinModule
  ],
  templateUrl: './pipeline-table.component.html',
  styleUrls: ['./pipeline-table.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PipelineTableComponent {
  @Input({ required: true }) projects!: ProjectWithLatestPipeline[]

  headers: Header<ProjectWithLatestPipeline>[] = [
    { title: 'Project', sortable: true, compare: (a, b) => compareString(a.project.name, b.project.name) },
    {
      title: 'Branch',
      sortable: true,
      compare: (a, b) => compareString(a.project.default_branch, b.project.default_branch)
    },
    { title: 'Topics', sortable: false, compare: null },
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

  branches$ = this.branchFilterService.getBranchesWithLatestPipeline()
  selectedProjectId$ = this.store.selectedProjectId$

  constructor(
    private i18n: NzI18nService,
    private store: LatestPipelineStore,
    private branchFilterService: BranchFilterService,
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

  async onRowClick({ id: projectId }: Project): Promise<void> {
    const selectedId = await firstValueFrom(this.selectedProjectId$)
    if (projectId === selectedId) {
      this.store.selectProjectId(undefined)
    } else {
      this.store.selectProjectId(projectId)
      this.actions.dispatch(fetchBranchesWithLatestPipeline({ projectId }))
      this.store.setBranchFilterText('')
    }
  }

  trackByProjectId(_: number, { project: { id } }: ProjectWithLatestPipeline): ProjectId {
    return id
  }
}
