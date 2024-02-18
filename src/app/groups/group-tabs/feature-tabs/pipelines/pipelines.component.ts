import { PipelineId } from '$groups/model/pipeline'
import { Status } from '$groups/model/status'
import { GroupStore } from '$groups/store/group.store'
import { filterArrayNotNull, filterNotNull } from '$groups/util/filter'
import { UIStore } from '$store/ui.store'
import { CommonModule } from '@angular/common'
import { Component } from '@angular/core'
import { Actions } from '@ngneat/effects-ng'
import { NzSpinModule } from 'ng-zorro-antd/spin'
import { firstValueFrom, map, switchMap, take } from 'rxjs'
import { AutoRefreshComponent } from '../components/auto-refresh/auto-refresh.component'
import { ProjectFilterComponent } from '../components/project-filter/project-filter.component'
import { TopicFilterComponent } from '../components/topic-filter/topic-filter.component'
import { ProjectFilterService } from '../service/project-filter.service'
import { BranchFilterComponent } from './components/branch-filter/branch-filter.component'
import { StatusFilterComponent } from './components/status-filter/status-filter.component'
import { PipelineTableComponent } from './pipeline-table/pipeline-table.component'
import { fetchProjectsWithPipeline } from './store/pipeline.actions'
import { PipelineStore } from './store/pipeline.store'

@Component({
  selector: 'gcd-pipelines',
  standalone: true,
  imports: [
    CommonModule,
    NzSpinModule,
    ProjectFilterComponent,
    TopicFilterComponent,
    BranchFilterComponent,
    StatusFilterComponent,
    PipelineTableComponent,
    AutoRefreshComponent
  ],
  templateUrl: './pipelines.component.html',
  styleUrls: ['./pipelines.component.scss']
})
export class PipelinesComponent {
  selectedGroupId$ = this.groupStore.selectedGroupId$.pipe(filterNotNull)

  autoRefreshLoading$ = this.selectedGroupId$.pipe(switchMap((groupId) => this.uiStore.autoRefreshLoading(groupId)))

  loading$ = this.pipelineStore.projectsLoading$
  projectsWithPipeline$ = this.filterService.getProjectsWithPipeline()
  selectedFilterTopics$ = this.selectedGroupId$.pipe(switchMap((groupId) => this.pipelineStore.topicsFilter(groupId)))
  selectedFilterTextProjects$ = this.selectedGroupId$.pipe(
    switchMap((groupId) => this.pipelineStore.projectFilter(groupId))
  )
  selectedFilterTextBranches$ = this.selectedGroupId$.pipe(
    switchMap((groupId) => this.pipelineStore.branchFilter(groupId))
  )
  selectedFilterStatuses$ = this.selectedGroupId$.pipe(
    switchMap((groupId) => this.pipelineStore.statusesFilter(groupId))
  )
  pinnedPipelines$ = this.selectedGroupId$.pipe(switchMap((groupId) => this.pipelineStore.pinnedPipelines(groupId)))

  projects$ = this.pipelineStore.projectsWithPipeline$.pipe(map((data) => data.map(({ project }) => project)))

  branches$ = this.pipelineStore.projectsWithPipeline$.pipe(
    map((data) => filterArrayNotNull(data.map(({ pipeline }) => pipeline?.ref)))
  )

  constructor(
    private actions: Actions,
    private pipelineStore: PipelineStore,
    private groupStore: GroupStore,
    private uiStore: UIStore,
    private filterService: ProjectFilterService
  ) {
    this.selectedGroupId$
      .pipe(take(1))
      .subscribe((groupId) => this.actions.dispatch(fetchProjectsWithPipeline({ groupId })))
  }

  async fetch(): Promise<void> {
    const groupId = await firstValueFrom(this.selectedGroupId$)
    this.actions.dispatch(fetchProjectsWithPipeline({ groupId, withLoader: false }))
  }

  async onFilterTopicsChanged(topics: string[]): Promise<void> {
    const groupId = await firstValueFrom(this.selectedGroupId$)
    this.pipelineStore.setTopicsFilter(groupId, topics)
  }

  async onFilterTextProjectsChanged(filterText: string): Promise<void> {
    const groupId = await firstValueFrom(this.selectedGroupId$)
    this.pipelineStore.setProjectFilter(groupId, filterText)
  }

  async onFilterTextBranchesChanged(filterText: string): Promise<void> {
    const groupId = await firstValueFrom(this.selectedGroupId$)
    this.pipelineStore.setBranchFilter(groupId, filterText)
  }

  async onFilterStatusesChanged(statuses: Status[]): Promise<void> {
    const groupId = await firstValueFrom(this.selectedGroupId$)
    this.pipelineStore.setStatusesFilter(groupId, statuses)
  }

  async onPinnedPipelinesChanged(pinnedPipelines: PipelineId[]): Promise<void> {
    const groupId = await firstValueFrom(this.selectedGroupId$)
    this.pipelineStore.setPinnedPipelines(groupId, pinnedPipelines)
  }
}
