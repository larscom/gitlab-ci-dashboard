import { FETCH_REFRESH_INTERVAL } from '$groups/http'
import { GroupId } from '$groups/model/group'
import { ProjectId, ProjectPipeline } from '$groups/model/project'
import { forkJoinFlatten } from '$groups/util/fork'
import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, computed, inject, input, signal } from '@angular/core'
import { takeUntilDestroyed } from '@angular/core/rxjs-interop'
import { NzSpinModule } from 'ng-zorro-antd/spin'
import { finalize, interval, switchMap } from 'rxjs'
import { ProjectFilterComponent } from '../components/project-filter/project-filter.component'
import { TopicFilterComponent } from '../components/topic-filter/topic-filter.component'
import { PipelineStatusTabsComponent } from './pipeline-status-tabs/pipeline-status-tabs.component'
import { LatestPipelineService } from './service/latest-pipeline.service'

@Component({
  selector: 'gcd-latest-pipelines',
  imports: [CommonModule, NzSpinModule, PipelineStatusTabsComponent, ProjectFilterComponent, TopicFilterComponent],
  templateUrl: './latest-pipelines.component.html',
  styleUrls: ['./latest-pipelines.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LatestPipelinesComponent implements OnInit {
  private latestPipelineService = inject(LatestPipelineService)
  private destroyRef = inject(DestroyRef)

  groupMap = input.required<Map<GroupId, Set<ProjectId>>>()

  filterText = signal('')
  filterTopics = signal<string[]>([])
  projectPipelines = signal<ProjectPipeline[]>([])
  loading = signal(false)

  projects = computed(() => {
    return this.projectPipelines()
      .filter(({ pipeline }) => pipeline != null)
      .map(({ project }) => project)
  })

  ngOnInit(): void {
    this.loading.set(true)

    forkJoinFlatten(
      this.groupMap(),
      this.latestPipelineService.getProjectsWithLatestPipeline.bind(this.latestPipelineService)
    )
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe((projectPipelines) => this.projectPipelines.set(projectPipelines))

    interval(FETCH_REFRESH_INTERVAL)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        switchMap(() =>
          forkJoinFlatten(
            this.groupMap(),
            this.latestPipelineService.getProjectsWithLatestPipeline.bind(this.latestPipelineService)
          )
        )
      )
      .subscribe((projectPipelines) => this.projectPipelines.set(projectPipelines))
  }

  onFilterTopicsChanged(topics: string[]): void {
    this.filterTopics.set(topics)
  }

  onFilterTextChanged(filterText: string): void {
    this.filterText.set(filterText)
  }
}
