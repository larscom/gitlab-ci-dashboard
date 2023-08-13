import { GroupId } from '$groups/model/group'
import { UIStore } from '$store/ui.store'
import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, Input, OnInit } from '@angular/core'
import { Actions } from '@ngneat/effects-ng'
import { NzSpinModule } from 'ng-zorro-antd/spin'
import { Observable, map } from 'rxjs'
import { AutoRefreshComponent } from '../components/auto-refresh/auto-refresh.component'
import { ProjectFilterComponent } from '../components/project-filter/project-filter.component'
import { ProjectFilterService } from '../service/project-filter.service'
import { PipelineTableComponent } from './pipeline-table/pipeline-table.component'
import { fetchProjectsWithPipeline, resetAllFilters } from './store/pipeline.actions'
import { PipelineStore } from './store/pipeline.store'

@Component({
  selector: 'gcd-pipelines',
  standalone: true,
  imports: [CommonModule, NzSpinModule, ProjectFilterComponent, PipelineTableComponent, AutoRefreshComponent],
  templateUrl: './pipelines.component.html',
  styleUrls: ['./pipelines.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PipelinesComponent implements OnInit {
  @Input({ required: true }) selectedGroupId!: GroupId

  autoRefreshLoading$!: Observable<boolean>

  loading$ = this.pipelineStore.projectsLoading$
  projectsWithPipeline$ = this.filterService.getProjectsWithPipeline()
  currentFilterTopics$ = this.pipelineStore.projectFilterTopics$
  currentFilterText$ = this.pipelineStore.projectFilterText$

  projects$ = this.pipelineStore.projectsWithPipeline$.pipe(map((data) => data.map(({ project }) => project)))

  constructor(
    private actions: Actions,
    private pipelineStore: PipelineStore,
    private uiStore: UIStore,
    private filterService: ProjectFilterService
  ) {}

  ngOnInit(): void {
    const { selectedGroupId: groupId } = this

    this.autoRefreshLoading$ = this.uiStore.autoRefreshLoading(groupId)
    this.actions.dispatch(resetAllFilters())
    this.actions.dispatch(fetchProjectsWithPipeline({ groupId }))
  }

  async fetch(): Promise<void> {
    const { selectedGroupId: groupId } = this
    this.actions.dispatch(fetchProjectsWithPipeline({ groupId, withLoader: false }))
  }

  onFilterTopicsChanged(topics: string[]): void {
    this.pipelineStore.setProjectFilterTopics(topics)
  }

  onFilterTextChanged(filterText: string): void {
    this.pipelineStore.setProjectFilterText(filterText)
  }
}
