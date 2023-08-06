import { GroupStore } from '$groups/store/group.store'
import { GroupId } from '$model/group'
import { UIStore } from '$store/ui.store'
import { CommonModule } from '@angular/common'
import { Component } from '@angular/core'
import { Actions } from '@ngneat/effects-ng'
import { NzSpinModule } from 'ng-zorro-antd/spin'
import { filter, firstValueFrom, map, switchMap } from 'rxjs'
import { AutoRefreshComponent } from '../components/auto-refresh/auto-refresh.component'
import { ProjectFilterComponent } from '../components/project-filter/project-filter.component'
import { PipelineStatusTabsComponent } from './pipeline-status-tabs/pipeline-status-tabs.component'
import { fetchProjectsWithLatestPipeline } from './store/latest-pipeline.actions'
import { LatestPipelineStore } from './store/latest-pipeline.store'

@Component({
  selector: 'gcd-latest-pipelines',
  standalone: true,
  imports: [CommonModule, NzSpinModule, PipelineStatusTabsComponent, ProjectFilterComponent, AutoRefreshComponent],
  templateUrl: './latest-pipelines.component.html',
  styleUrls: ['./latest-pipelines.component.scss']
})
export class LatestPipelinesComponent {
  selectedGroupId$ = this.groupStore.selectedGroupId$.pipe(filter((id): id is GroupId => id != null))

  loading$ = this.latestPipelineStore.projectsLoading$
  autoRefreshLoading$ = this.selectedGroupId$.pipe(switchMap((groupId) => this.uiStore.autoRefreshLoading(groupId)))

  projects$ = this.latestPipelineStore.projectsWithLatestPipeline$.pipe(
    map((map) =>
      Array.from(map.values())
        .flat()
        .map(({ project }) => project)
    )
  )
  currentFilterTopics$ = this.latestPipelineStore.projectFilterTopics$
  currentFilterText$ = this.latestPipelineStore.projectFilterText$

  constructor(
    private actions: Actions,
    private groupStore: GroupStore,
    private latestPipelineStore: LatestPipelineStore,
    private uiStore: UIStore
  ) {}

  async fetch(): Promise<void> {
    const groupId = await firstValueFrom(this.selectedGroupId$)
    this.actions.dispatch(fetchProjectsWithLatestPipeline({ groupId, withLoader: false }))
  }

  onFilterTopicsChanged(topics: string[]): void {
    this.latestPipelineStore.setProjectFilterTopics(topics)
  }

  onFilterTextChanged(filterText: string): void {
    this.latestPipelineStore.setProjectFilterText(filterText)
  }
}
