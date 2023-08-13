import { GroupId } from '$groups/model/group'
import { UIStore } from '$store/ui.store'
import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, Input, OnInit } from '@angular/core'
import { Actions } from '@ngneat/effects-ng'
import { NzSpinModule } from 'ng-zorro-antd/spin'
import { Observable, map } from 'rxjs'
import { AutoRefreshComponent } from '../components/auto-refresh/auto-refresh.component'
import { ProjectFilterComponent } from '../components/project-filter/project-filter.component'
import { PipelineStatusTabsComponent } from './pipeline-status-tabs/pipeline-status-tabs.component'
import { fetchProjectsWithLatestPipeline, resetAllFilters } from './store/latest-pipeline.actions'
import { LatestPipelineStore } from './store/latest-pipeline.store'

@Component({
  selector: 'gcd-latest-pipelines',
  standalone: true,
  imports: [CommonModule, NzSpinModule, PipelineStatusTabsComponent, ProjectFilterComponent, AutoRefreshComponent],
  templateUrl: './latest-pipelines.component.html',
  styleUrls: ['./latest-pipelines.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LatestPipelinesComponent implements OnInit {
  @Input({ required: true }) selectedGroupId!: GroupId

  autoRefreshLoading$!: Observable<boolean>

  loading$ = this.latestPipelineStore.projectsLoading$
  projects$ = this.latestPipelineStore.projectsWithLatestPipeline$.pipe(
    map((map) =>
      Array.from(map.values())
        .flat()
        .map(({ project }) => project)
    )
  )
  currentFilterTopics$ = this.latestPipelineStore.projectFilterTopics$
  currentFilterText$ = this.latestPipelineStore.projectFilterText$

  constructor(private actions: Actions, private latestPipelineStore: LatestPipelineStore, private uiStore: UIStore) {}

  ngOnInit(): void {
    const { selectedGroupId: groupId } = this

    this.autoRefreshLoading$ = this.uiStore.autoRefreshLoading(groupId)
    this.actions.dispatch(resetAllFilters())
    this.actions.dispatch(fetchProjectsWithLatestPipeline({ groupId }))
  }

  async fetch(): Promise<void> {
    const { selectedGroupId: groupId } = this
    this.actions.dispatch(fetchProjectsWithLatestPipeline({ groupId, withLoader: false }))
  }

  onFilterTopicsChanged(topics: string[]): void {
    this.latestPipelineStore.setProjectFilterTopics(topics)
  }

  onFilterTextChanged(filterText: string): void {
    this.latestPipelineStore.setProjectFilterText(filterText)
  }
}
