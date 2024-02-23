import { JobsComponent } from '$groups/group-tabs/feature-tabs/components/jobs/jobs.component'
import { Pipeline, ProjectLatestPipeline, ProjectPipeline } from '$groups/model/pipeline'
import { Project, ProjectId } from '$groups/model/project'
import { Status } from '$groups/model/status'
import { GroupStore } from '$groups/store/group.store'
import { compareString, compareStringDate } from '$groups/util/compare'
import { filterNotNull } from '$groups/util/filter'
import { statusToScope } from '$groups/util/status-scope'
import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core'
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
import { LatestBranchFilterService } from './pipeline-table-branch/latest-branch-filter/latest-branch-filter.service'
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
    NzSpinModule,
    PipelineTableBranchComponent,
    JobsComponent
  ],
  templateUrl: './pipeline-table.component.html',
  styleUrls: ['./pipeline-table.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PipelineTableComponent {
  projects = input.required<ProjectPipeline[]>()
  status = input<Status>()

  i18n = inject(NzI18nService)
  latestPipelineStore = inject(LatestPipelineStore)
  groupStore = inject(GroupStore)
  branchFilterService = inject(LatestBranchFilterService)
  actions = inject(Actions)

  headers: Header<ProjectPipeline>[] = [
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

  branches$ = this.branchFilterService.getBranchesWithLatestPipeline()
  selectedProjectId$ = this.latestPipelineStore.selectedProjectId$

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

  async onRowClick({ id: projectId }: Project): Promise<void> {
    const selectedId = await firstValueFrom(this.selectedProjectId$)
    if (projectId === selectedId) {
      this.latestPipelineStore.selectProjectId(undefined)
    } else {
      const groupId = await firstValueFrom(this.groupStore.selectedGroupId$.pipe(filterNotNull))
      this.latestPipelineStore.selectProjectId(projectId)
      this.actions.dispatch(fetchBranchesWithLatestPipeline({ projectId }))
      this.latestPipelineStore.setBranchFilter(groupId, '')
    }
  }

  trackByProjectId(_: number, { project: { id } }: ProjectLatestPipeline): ProjectId {
    return id
  }
}
