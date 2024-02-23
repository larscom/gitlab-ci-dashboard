import { GroupStore } from '$groups/store/group.store'
import { filterNotNull } from '$groups/util/filter'
import { UIStore } from '$store/ui.store'
import { CommonModule } from '@angular/common'
import { Component } from '@angular/core'
import { Actions } from '@ngneat/effects-ng'
import { NzSpinModule } from 'ng-zorro-antd/spin'
import { firstValueFrom, map, switchMap, take } from 'rxjs'
import { AutoRefreshComponent } from '../components/auto-refresh/auto-refresh.component'
import { ProjectFilterComponent } from '../components/project-filter/project-filter.component'
import { TopicFilterComponent } from '../components/topic-filter/topic-filter.component'
import { PipelineStatusTabsComponent } from './pipeline-status-tabs/pipeline-status-tabs.component'
import { fetchProjectsWithLatestPipeline } from './store/latest-pipeline.actions'
import { LatestPipelineStore } from './store/latest-pipeline.store'

@Component({
  selector: 'gcd-latest-pipelines',
  standalone: true,
  imports: [
    CommonModule,
    NzSpinModule,
    PipelineStatusTabsComponent,
    ProjectFilterComponent,
    TopicFilterComponent,
    AutoRefreshComponent
  ],
  templateUrl: './latest-pipelines.component.html',
  styleUrls: ['./latest-pipelines.component.scss']
})
export class LatestPipelinesComponent {
  selectedGroupId$ = this.groupStore.selectedGroupId$.pipe(filterNotNull)

  autoRefreshLoading$ = this.selectedGroupId$.pipe(switchMap((groupId) => this.uiStore.autoRefreshLoading(groupId)))
  selectedFilterTopics$ = this.selectedGroupId$.pipe(
    switchMap((groupId) => this.latestPipelineStore.topicsFilter(groupId))
  )
  selectedFilterText$ = this.selectedGroupId$.pipe(
    switchMap((groupId) => this.latestPipelineStore.projectFilter(groupId))
  )

  loading$ = this.latestPipelineStore.projectsLoading$
  projects$ = this.latestPipelineStore.projectsWithLatestPipeline$.pipe(
    map((projects) => projects.filter(({ pipeline }) => pipeline != null).map(({ project }) => project))
  )

  constructor(
    private actions: Actions,
    private latestPipelineStore: LatestPipelineStore,
    private groupStore: GroupStore,
    private uiStore: UIStore
  ) {
    this.selectedGroupId$
      .pipe(take(1))
      .subscribe((groupId) => this.actions.dispatch(fetchProjectsWithLatestPipeline({ groupId })))
  }

  async fetch(): Promise<void> {
    const groupId = await firstValueFrom(this.selectedGroupId$)
    this.actions.dispatch(fetchProjectsWithLatestPipeline({ groupId, withLoader: false }))
  }

  async onFilterTopicsChanged(topics: string[]): Promise<void> {
    const groupId = await firstValueFrom(this.selectedGroupId$)
    this.latestPipelineStore.setTopicsFilter(groupId, topics)
  }

  async onFilterTextChanged(filterText: string): Promise<void> {
    const groupId = await firstValueFrom(this.selectedGroupId$)
    this.latestPipelineStore.setProjectFilter(groupId, filterText)
  }
}
