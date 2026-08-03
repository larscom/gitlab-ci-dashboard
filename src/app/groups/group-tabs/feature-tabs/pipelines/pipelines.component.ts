import { FETCH_REFRESH_INTERVAL } from '$groups/http'
import { GroupId } from '$groups/model/group'
import { PipelineId } from '$groups/model/pipeline'
import { ProjectId, ProjectPipeline, ProjectPipelines } from '$groups/model/project'
import { Status } from '$groups/model/status'
import { filterArrayNotNull, filterPipeline, filterProject, filterString } from '$groups/util/filter'
import { forkJoinFlatten } from '$groups/util/fork'
import { projectNamespacePath } from '$groups/util/project-path'
import { AnalyticsRangeService } from '$service/analytics-range.service'

import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, computed, effect, inject, input, signal } from '@angular/core'
import { takeUntilDestroyed } from '@angular/core/rxjs-interop'
import { NzDropDownModule } from 'ng-zorro-antd/dropdown'
import { NzMenuModule } from 'ng-zorro-antd/menu'
import { NzSpinModule } from 'ng-zorro-antd/spin'
import { NzButtonModule } from 'ng-zorro-antd/button'
import { NzIconModule } from 'ng-zorro-antd/icon'
import { NzTooltipModule } from 'ng-zorro-antd/tooltip'
import { finalize, interval, switchMap } from 'rxjs'
import { ProjectFilterComponent } from '../components/project-filter/project-filter.component'
import { TopicFilterComponent } from '../components/topic-filter/topic-filter.component'
import { BranchFilterComponent } from './components/branch-filter/branch-filter.component'
import { GroupFilterComponent } from './components/group-filter/group-filter.component'
import { PipelineSummaryComponent } from './components/pipeline-summary/pipeline-summary.component'
import { StatusFilterComponent } from './components/status-filter/status-filter.component'
import { PipelineTableComponent } from './pipeline-table/pipeline-table.component'
import { PipelinesService } from './service/pipelines.service'
import { FavoriteService } from '../../favorites/favorite.service'

@Component({
  selector: 'gcd-pipelines',
  imports: [NzDropDownModule, NzMenuModule,
    NzSpinModule,
    NzButtonModule,
    NzIconModule,
    NzTooltipModule,
    ProjectFilterComponent,
    GroupFilterComponent,
    PipelineSummaryComponent,
    TopicFilterComponent,
    BranchFilterComponent,
    StatusFilterComponent,
    PipelineTableComponent
],
  templateUrl: './pipelines.component.html',
  styleUrls: ['./pipelines.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PipelinesComponent implements OnInit {
  private pipelinesService = inject(PipelinesService)
  readonly range = inject(AnalyticsRangeService)
  private destroyRef = inject(DestroyRef)
  private favoriteService = inject(FavoriteService)

  groupMap = input.required<Map<GroupId, Set<ProjectId>>>()
  favoritesMode = input(false)

  filterTextProject = signal('')
  filterTextGroup = signal('')
  filterTextBranch = signal('')
  filterTopics = signal<string[]>([])
  filterStatuses = signal<Status[]>([])
  effectiveStatuses = signal<ReadonlyMap<PipelineId, Status>>(new Map())
  favoriteProjectSelection = signal<Set<ProjectId>|null>(null)
  favoriteBranchSelection = signal<Set<string>|null>(null)
  favoriteProjectSearch = signal('')
  favoriteBranchSearch = signal('')

  projectPipelines = signal<ProjectPipelines[]>([])
  loading = signal(false)
  refreshing = signal(false)

  statusCounts = computed<ReadonlyMap<Status, number>>(() => {
    const counts = new Map<Status, number>()

    for (const { pipelines } of this.projectPipelines()) {
      for (const pipeline of pipelines) {
        const status = this.effectiveStatuses().get(pipeline.id) ?? pipeline.status
        counts.set(status, (counts.get(status) ?? 0) + 1)
      }
    }

    return counts
  })

  filteredProjectPipelines = computed(() => {
    return this.projectPipelines()
      .flatMap(({ project, pipelines, group_id }) =>
        pipelines.map((pipeline) => ({
          project,
          pipeline: {
            ...pipeline,
            status: this.effectiveStatuses().get(pipeline.id) ?? pipeline.status
          },
          group_id
        }))
      )
      .filter(({ pipeline, project }) => {
        const favoriteSelection=this.favoriteProjectSelection(),branchSelection=this.favoriteBranchSelection()
        return (
          (!this.favoritesMode()||favoriteSelection===null||favoriteSelection.has(project.id)) &&
          (!this.favoritesMode()||branchSelection===null||(pipeline.ref!==null&&branchSelection.has(pipeline.ref))) &&
          filterProject(project, this.filterTextProject(), this.filterTopics()) &&
          filterString(projectNamespacePath(project), this.filterTextGroup()) &&
          filterPipeline(pipeline, this.filterTextBranch(), this.filterStatuses())
        )
      })
      .sort((a, b) => this.sortByUpdatedAt(a, b))
  })

  projects = computed(() => {
    return this.projectPipelines()
      .filter(({ pipelines }) => this.favoritesMode() || pipelines.length > 0)
      .map(({ project }) => project)
  })
  branches = computed(() => {
    return filterArrayNotNull(this.projectPipelines().flatMap(({ pipelines }) => pipelines.map(({ ref }) => ref)))
  })
  favoriteProjectOptions=computed(()=>{const seen=new Set<ProjectId>();return this.projects().filter(project=>{if(seen.has(project.id))return false;seen.add(project.id);return true}).sort((a,b)=>a.name.localeCompare(b.name))})
  filteredFavoriteProjectOptions=computed(()=>{const query=this.favoriteProjectSearch().trim().toLowerCase();return query?this.favoriteProjectOptions().filter(project=>project.name.toLowerCase().includes(query)):this.favoriteProjectOptions()})
  favoriteProjectLabel=computed(()=>{const selected=this.favoriteProjectSelection();return selected===null?'All':selected.size===1?(this.favoriteProjectOptions().find(project=>selected.has(project.id))?.name||'1 selected'):`${selected.size} selected`})
  favoriteBranchOptions=computed(()=>{const selectedProjects=this.favoriteProjectSelection();const branches=this.projectPipelines().filter(({project})=>selectedProjects===null||selectedProjects.has(project.id)).flatMap(({pipelines})=>pipelines.map(({ref})=>ref)).filter((ref):ref is string=>ref!==null);return Array.from(new Set(branches)).sort((a,b)=>a.localeCompare(b))})
  filteredFavoriteBranchOptions=computed(()=>{const query=this.favoriteBranchSearch().trim().toLowerCase();return query?this.favoriteBranchOptions().filter(branch=>branch.toLowerCase().includes(query)):this.favoriteBranchOptions()})
  favoriteBranchLabel=computed(()=>{const selected=this.favoriteBranchSelection();return selected===null?'All':selected.size===1?(Array.from(selected)[0]||'1 selected'):`${selected.size} selected`})

  constructor() {
    effect((onCleanup) => {
      this.groupMap()
      this.range.hours()
      const request = this.loadPipelines(false, this.loading)

      onCleanup(() => request.unsubscribe())
    })
  }

  ngOnInit(): void {
    interval(FETCH_REFRESH_INTERVAL)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        switchMap(() =>
          forkJoinFlatten(this.groupMap(), (groupId, projectIds) =>
            this.pipelinesService.getProjectsWithPipelines(groupId, projectIds, false, this.range.hours())
          )
        )
      )

      .subscribe((projectPipelines) => this.projectPipelines.set(projectPipelines))
  }

  onRangeChange(value: number): void {
    this.range.set(value)
  }

  onRefresh(): void {
    if (!this.refreshing()) {
      this.loadPipelines(true, this.refreshing)
    }
  }

  onFilterTopicsChanged(topics: string[]) {
    this.filterTopics.set(topics)
  }

  onFilterTextProjectsChanged(filterText: string) {
    this.filterTextProject.set(filterText)
  }

  onFilterTextGroupsChanged(filterText: string) {
    this.filterTextGroup.set(filterText)
  }

  onFilterTextBranchesChanged(filterText: string) {
    this.filterTextBranch.set(filterText)
  }

  onFilterStatusesChanged(statuses: Status[]) {
    this.filterStatuses.set(statuses)
  }

  isFavoriteProjectSelected(id:ProjectId){const selected=this.favoriteProjectSelection();return selected===null||selected.has(id)}
  toggleAllFavoriteProjects(){this.favoriteProjectSelection.update(selected=>selected===null?new Set():null);this.favoriteBranchSelection.set(null)}
  toggleFavoriteProject(id:ProjectId){const all=this.favoriteProjectOptions().map(project=>project.id);const selected=this.favoriteProjectSelection()===null?new Set(all):new Set(this.favoriteProjectSelection()!);selected.has(id)?selected.delete(id):selected.add(id);this.favoriteProjectSelection.set(selected.size===all.length?null:selected);this.favoriteBranchSelection.set(null)}
  removeFavoriteProject(id:ProjectId,event:Event){event.preventDefault();event.stopPropagation();const item=this.projectPipelines().find(({project})=>project.id===id);if(!item)return;this.favoriteService.removeProject(item.group_id,id);const selected=this.favoriteProjectSelection();if(selected!==null){const next=new Set(selected);next.delete(id);this.favoriteProjectSelection.set(next)}this.favoriteBranchSelection.set(null)}
  isFavoriteBranchSelected(branch:string){const selected=this.favoriteBranchSelection();return selected===null||selected.has(branch)}
  toggleAllFavoriteBranches(){this.favoriteBranchSelection.update(selected=>selected===null?new Set():null)}
  toggleFavoriteBranch(branch:string){const all=this.favoriteBranchOptions();const selected=this.favoriteBranchSelection()===null?new Set(all):new Set(this.favoriteBranchSelection()!);selected.has(branch)?selected.delete(branch):selected.add(branch);this.favoriteBranchSelection.set(selected.size===all.length?null:selected)}

  onPipelineStatusChanged({ pipelineId, status }: { pipelineId: PipelineId; status?: Status }): void {
    const statuses = new Map(this.effectiveStatuses())
    if (status) {
      statuses.set(pipelineId, status)
    } else {
      statuses.delete(pipelineId)
    }
    this.effectiveStatuses.set(statuses)
  }

  private loadPipelines(refresh: boolean, activity: { set(value: boolean): void }) {
    activity.set(true)
    const request = (groupId: GroupId, projectIds?: Set<ProjectId>) =>
      this.pipelinesService.getProjectsWithPipelines(groupId, projectIds, refresh, this.range.hours())

    return forkJoinFlatten(this.groupMap(), request)
      .pipe(finalize(() => activity.set(false)))
      .subscribe((projectPipelines) => this.projectPipelines.set(projectPipelines))
  }

  private sortByUpdatedAt(a: ProjectPipeline, b: ProjectPipeline): number {
    if (a.pipeline == null || b.pipeline == null) {
      return 0
    }
    return new Date(b.pipeline.updated_at).getTime() - new Date(a.pipeline.updated_at).getTime()
  }

}
