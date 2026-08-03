import { GroupId } from '$groups/model/group'
import { ProjectId } from '$groups/model/project'
import { Runner, RunnerWithJobs } from '$groups/model/runner'
import { forkJoinFlatten } from '$groups/util/fork'
import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, computed, effect, inject, input, signal } from '@angular/core'
import { takeUntilDestroyed } from '@angular/core/rxjs-interop'
import { NzButtonModule } from 'ng-zorro-antd/button'
import { NzIconModule } from 'ng-zorro-antd/icon'
import { NzInputModule } from 'ng-zorro-antd/input'
import { NzSpinModule } from 'ng-zorro-antd/spin'
import { finalize, interval, switchMap } from 'rxjs'
import { RunnerService } from './runner.service'
import { RunnerTableComponent } from './runner-table/runner-table.component'

const RUNNER_REFRESH_INTERVAL = 30_000

@Component({
  selector: 'gcd-runners',
  imports: [CommonModule, NzButtonModule, NzIconModule, NzInputModule, NzSpinModule, RunnerTableComponent],
  templateUrl: './runners.component.html',
  styleUrls: ['./runners.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RunnersComponent implements OnInit {
  private runnerService = inject(RunnerService)
  private destroyRef = inject(DestroyRef)

  groupMap = input.required<Map<GroupId, Set<ProjectId>>>()

  runners = signal<RunnerWithJobs[]>([])
  filterTextGroup = signal('')
  filterTextRunner = signal('')
  filterTextTag = signal('')
  filterStatuses = signal<string[]>([])
  loading = signal(false)
  refreshing = signal(false)
  hoverTooltip = signal<{ text: string; x: number; y: number } | null>(null)

  statusCounts = computed<ReadonlyMap<string, number>>(() => {
    const counts = new Map<string, number>()
    for (const { runner } of this.runners()) {
      const status = runnerStatus(runner)
      counts.set(status, (counts.get(status) ?? 0) + 1)
    }
    return counts
  })

  filteredRunners = computed(() => {
    const group = this.filterTextGroup().trim().toLowerCase()
    const runnerText = this.filterTextRunner().trim().toLowerCase()
    const tag = this.filterTextTag().trim().toLowerCase()
    const statuses = this.filterStatuses()

    return this.runners().filter(({ runner, jobs }) =>
      runnerScope(runner).toLowerCase().includes(group) &&
      (tag.length === 0 || runner.tag_list.some((runnerTag) => runnerTag.toLowerCase().includes(tag))) &&
      (statuses.length === 0 || statuses.includes(runnerStatus(runner))) &&
      [
        runner.id,
        runner.description,
        runner.ip_address,
        runner.runner_type,
        ...jobs.flatMap((job) => [job.name, job.stage, job.ref, job.pipeline.project_id, job.pipeline.id])
      ].some((field) => String(field).toLowerCase().includes(runnerText))
    )
  })

  constructor() {
    effect((onCleanup) => {
      this.groupMap()
      const request = this.load(false, true)

      onCleanup(() => request.unsubscribe())
    })
  }

  ngOnInit(): void {
    interval(RUNNER_REFRESH_INTERVAL)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        switchMap(() => this.getRunners(false, false))
      )
      .subscribe((runners) => this.runners.set(runners))
  }

  refresh(): void {
    this.load(true, false)
  }

  onFilterTextGroupChanged(value: string): void {
    this.filterTextGroup.set(value)
  }

  onFilterTextRunnerChanged(value: string): void {
    this.filterTextRunner.set(value)
  }

  onFilterTextTagChanged(value: string): void {
    this.filterTextTag.set(value)
  }

  toggleStatus(status: string): void {
    this.filterStatuses.update((statuses) =>
      statuses.includes(status) ? statuses.filter((value) => value !== status) : [...statuses, status]
    )
  }

  statusSelected(status: string): boolean {
    return this.filterStatuses().includes(status)
  }

  moveTooltip(event: PointerEvent, text: string): void {
    this.hoverTooltip.set({
      text,
      x: Math.min(event.clientX + 14, window.innerWidth - 130),
      y: Math.min(event.clientY + 14, window.innerHeight - 48)
    })
  }

  runnerSegmentStyle(status: string): Record<string, string> {
    const color = status === 'running' ? '#18d99a' : status === 'idle' ? '#39a0ff' : status === 'paused' ? '#ffc21c' : status === 'offline' ? '#ff8291' : '#ff5267'
    const fill = status === 'running' ? '#18d99a52' : status === 'idle' ? '#39a0ff52' : status === 'paused' ? '#ffc21c52' : status === 'offline' ? '#ff829152' : '#ff526752'
    return {
      background: fill,
      border: `1px solid ${color}`,
      boxShadow: `inset 0 0 16px ${fill}, 0 0 6px ${fill}`
    }
  }

  private load(refresh: boolean, initial: boolean) {
    if (initial) {
      this.loading.set(true)
    } else {
      this.refreshing.set(true)
    }

    return this.getRunners(refresh)
      .pipe(
        finalize(() => {
          this.loading.set(false)
          this.refreshing.set(false)
        })
      )
      .subscribe((runners) => this.runners.set(runners))
  }

  private getRunners(refresh: boolean, reportError = true) {
    return forkJoinFlatten(this.groupMap(), (groupId) =>
      this.runnerService.getRunners(groupId, refresh, reportError)
    )
  }
}

function runnerScope(runner: Runner): string {
  if (runner.runner_type === 'project_type' && runner.projects.length) {
    return runner.projects.map(({ path_with_namespace, name }) => path_with_namespace || name).join(', ')
  }
  return runner.scope_name || ''
}

function runnerStatus(runner: Runner): string {
  if (runner.paused) return 'paused'
  if (runner.job_execution_status === 'running' || runner.job_execution_status === 'active') return 'running'
  if (runner.online && runner.job_execution_status === 'idle') return 'idle'
  return runner.status || (runner.online ? 'online' : 'offline')
}
